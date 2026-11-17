import { resolve } from 'node:path';

/** Public URL prefix of uploaded files: /uploads/dishes/thieboudienne-1a2b3c.webp */
export const UPLOADS_URL_PREFIX = '/uploads';

/** Folder on disk where uploads are written (apps/api/uploads by default) */
export const getUploadsDir = (): string => resolve(process.env.UPLOADS_DIR ?? resolve(process.cwd(), 'uploads'));

/** Base URL used to turn "/uploads/…" into an absolute URL the website can load */
export const getPublicApiUrl = (): string => (process.env.PUBLIC_API_URL ?? 'http://localhost:5000').replace(/\/$/, '');

/** Stored paths are relative ("/uploads/…"); external URLs are kept as they are */
export const toPublicImageUrl = (storedPath: string | null): string | null => {
  if (!storedPath) return null;
  return storedPath.startsWith('/') ? `${getPublicApiUrl()}${storedPath}` : storedPath;
};
