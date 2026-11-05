import type { Metadata } from 'next';
import { Fraunces, Inter } from 'next/font/google';
import './globals.css';

const fraunces = Fraunces({ subsets: ['latin'], variable: '--font-display', weight: ['500', '600'] });
const inter = Inter({ subsets: ['latin'], variable: '--font-body' });

export const metadata: Metadata = {
  title: 'Maquis 18 — Cuisine guinéenne faite maison, Paris 18e',
  description:
    'Attiéké, foutou, mafé… des plats généreux préparés chaque jour avec des produits bio. Sur place ou à emporter, 7 j/7.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" className={`${fraunces.variable} ${inter.variable}`}>
      <body>{children}</body>
    </html>
  );
}
