import type { MetadataRoute } from 'next';
import { SITE_URL } from '@/lib/site';

/** Served at /sitemap.xml: the public pages Google should index */
export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date();
  return [
    { url: `${SITE_URL}/`, lastModified, changeFrequency: 'weekly', priority: 1 },
    { url: `${SITE_URL}/mentions-legales`, lastModified, changeFrequency: 'yearly', priority: 0.2 },
    { url: `${SITE_URL}/confidentialite`, lastModified, changeFrequency: 'yearly', priority: 0.2 },
  ];
}
