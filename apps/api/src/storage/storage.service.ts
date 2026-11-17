import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import type { ApiErrorResponse } from '@maquis18/shared';
import { createHash } from 'node:crypto';
import { mkdir, unlink, writeFile } from 'node:fs/promises';
import { dirname, join, normalize, relative, sep } from 'node:path';
import sharp from 'sharp';
import { UPLOADS_URL_PREFIX, getUploadsDir } from './storage.paths';

export type ImageFolder = 'dishes' | 'site';

/** Longest side of a stored image: sharp on retina screens, light enough for mobile */
const MAX_WIDTH = 1600;

/** "Foutou banane, sauce graine" → "foutou-banane-sauce-graine", "Mafé de bœuf" → "mafe-de-boeuf" */
export const slugify = (text: string): string =>
  text
    // Ligatures are not split by Unicode normalization: "œ" would otherwise become "-"
    .replace(/œ/g, 'oe')
    .replace(/Œ/g, 'Oe')
    .replace(/æ/g, 'ae')
    .replace(/Æ/g, 'Ae')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '') // removes accents
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 60) || 'image';

/**
 * Stores images on the API's disk and serves them under /uploads.
 * Every image is re-encoded with sharp:
 * - only real images get through (a renamed .exe fails to decode),
 * - metadata (GPS position in EXIF…) is removed,
 * - output is a resized WebP, much lighter than the original photo.
 *
 * In production the uploads folder must be persistent (e.g. a Railway volume),
 * or this service can be swapped for S3/Cloudinary with the same save/remove methods.
 */
@Injectable()
export class StorageService {
  private readonly logger = new Logger(StorageService.name);

  /** Returns the public path of the saved image, e.g. "/uploads/dishes/mafe-de-boeuf-3f9a1c2b.webp" */
  async saveImage(input: Buffer, folder: ImageFolder, name: string): Promise<string> {
    let webp: Buffer;
    try {
      webp = await sharp(input)
        .rotate() // applies the EXIF orientation before metadata is dropped
        .resize({ width: MAX_WIDTH, withoutEnlargement: true })
        .webp({ quality: 80 })
        .toBuffer();
    } catch {
      const body: ApiErrorResponse = {
        statusCode: 400,
        message: 'Ce fichier n’est pas une image valide.',
        errors: { image: 'Ce fichier n’est pas une image valide (JPEG, PNG ou WebP).' },
      };
      throw new BadRequestException(body);
    }

    // Content hash in the name: a new photo gets a new URL, so browsers never show a cached old one
    const hash = createHash('sha256').update(webp).digest('hex').slice(0, 8);
    const relativePath = `${folder}/${slugify(name)}-${hash}.webp`;
    const absolutePath = join(getUploadsDir(), relativePath);

    await mkdir(dirname(absolutePath), { recursive: true });
    await writeFile(absolutePath, webp);
    return `${UPLOADS_URL_PREFIX}/${relativePath}`;
  }

  /** Deletes a file previously returned by saveImage; ignores external URLs and missing files */
  async remove(publicPath: string | null): Promise<void> {
    if (!publicPath?.startsWith(`${UPLOADS_URL_PREFIX}/`)) return;

    const uploadsDir = getUploadsDir();
    const absolutePath = normalize(join(uploadsDir, publicPath.slice(UPLOADS_URL_PREFIX.length)));
    // Path traversal guard: never delete anything outside the uploads folder
    if (relative(uploadsDir, absolutePath).startsWith('..') || !absolutePath.startsWith(uploadsDir + sep)) return;

    try {
      await unlink(absolutePath);
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== 'ENOENT') {
        this.logger.warn(`Image non supprimée (${publicPath}) : ${(error as Error).message}`);
      }
    }
  }
}
