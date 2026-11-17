import { mkdtemp, readFile, rm, stat, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import sharp from 'sharp';
import { toPublicImageUrl } from './storage.paths';
import { StorageService, slugify } from './storage.service';

describe('slugify', () => {
  it.each([
    ['Foutou banane, sauce graine', 'foutou-banane-sauce-graine'],
    ['Mafé de bœuf', 'mafe-de-boeuf'],
    ['  Dégué !  ', 'degue'],
    ['***', 'image'],
  ])('"%s" → "%s"', (input, expected) => expect(slugify(input)).toBe(expected));
});

describe('toPublicImageUrl', () => {
  it('prefixes stored paths with the public API URL and keeps external URLs', () => {
    expect(toPublicImageUrl('/uploads/dishes/a.webp')).toBe('http://localhost:5000/uploads/dishes/a.webp');
    expect(toPublicImageUrl('https://cdn.example.com/a.jpg')).toBe('https://cdn.example.com/a.jpg');
    expect(toPublicImageUrl(null)).toBeNull();
  });
});

describe('StorageService', () => {
  let uploadsDir: string;
  const service = new StorageService();

  beforeEach(async () => {
    uploadsDir = await mkdtemp(join(tmpdir(), 'maquis18-uploads-'));
    process.env.UPLOADS_DIR = uploadsDir;
  });

  afterEach(async () => {
    delete process.env.UPLOADS_DIR;
    await rm(uploadsDir, { recursive: true, force: true });
  });

  /** A real 3000×2000 JPEG, generated on the fly */
  const bigJpeg = () =>
    sharp({ create: { width: 3000, height: 2000, channels: 3, background: '#c1502e' } })
      .jpeg()
      .toBuffer();

  it('re-encodes the image as a resized WebP and returns its public path', async () => {
    const path = await service.saveImage(await bigJpeg(), 'dishes', 'Mafé de bœuf');

    expect(path).toMatch(/^\/uploads\/dishes\/mafe-de-boeuf-[0-9a-f]{8}\.webp$/);
    const saved = await readFile(join(uploadsDir, path.replace('/uploads/', '')));
    const metadata = await sharp(saved).metadata();
    expect(metadata.format).toBe('webp');
    expect(metadata.width).toBe(1600);
  });

  it('refuses a file that is not an image, with a message on the "image" field', async () => {
    await expect(service.saveImage(Buffer.from('MZ fake executable'), 'dishes', 'x')).rejects.toMatchObject({
      response: { errors: { image: expect.any(String) } },
    });
  });

  it('removes a stored file', async () => {
    const path = await service.saveImage(await bigJpeg(), 'dishes', 'alloco');

    await service.remove(path);

    await expect(stat(join(uploadsDir, path.replace('/uploads/', '')))).rejects.toMatchObject({ code: 'ENOENT' });
  });

  it('never deletes outside the uploads folder (path traversal)', async () => {
    const outside = join(uploadsDir, '..', `keep-me-${Date.now()}.txt`);
    await writeFile(outside, 'important');

    await service.remove(`/uploads/../${outside.split('/').pop()}`);

    await expect(readFile(outside, 'utf8')).resolves.toBe('important');
    await rm(outside);
  });

  it('ignores external URLs and missing files', async () => {
    await expect(service.remove('https://cdn.example.com/a.jpg')).resolves.toBeUndefined();
    await expect(service.remove('/uploads/dishes/missing.webp')).resolves.toBeUndefined();
  });
});
