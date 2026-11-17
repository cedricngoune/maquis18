import type { MetadataRoute } from 'next';
import { SITE_URL } from '@/lib/site';

/** Served at /robots.txt: everything is public except the back-office and personal reservation pages */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: '*', allow: '/', disallow: ['/admin', '/reservation'] },
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
