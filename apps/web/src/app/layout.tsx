import type { Metadata } from 'next';
import { Fraunces, Inter } from 'next/font/google';
import { RESTAURANT } from '@maquis18/shared';
import { SITE_URL } from '@/lib/site';
import './globals.css';

const fraunces = Fraunces({ subsets: ['latin'], variable: '--font-display', weight: ['500', '600'] });
const inter = Inter({ subsets: ['latin'], variable: '--font-body' });

const defaultTitle = `${RESTAURANT.name} — ${RESTAURANT.tagline}`;

export const metadata: Metadata = {
  // Lets Next.js turn relative URLs (og:image, canonical…) into absolute ones
  metadataBase: new URL(SITE_URL),
  title: {
    default: defaultTitle,
    template: `%s — ${RESTAURANT.name}`, // pages set only their own title, e.g. "Mentions légales"
  },
  description: RESTAURANT.description,
  alternates: { canonical: '/' },
  openGraph: {
    type: 'website',
    locale: 'fr_FR',
    siteName: RESTAURANT.name,
    title: defaultTitle,
    description: RESTAURANT.description,
    url: '/',
    // The image itself comes from app/opengraph-image.tsx
  },
  twitter: {
    card: 'summary_large_image',
    title: defaultTitle,
    description: RESTAURANT.description,
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" className={`${fraunces.variable} ${inter.variable}`}>
      <body>{children}</body>
    </html>
  );
}
