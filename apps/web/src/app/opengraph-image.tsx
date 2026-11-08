import { ImageResponse } from 'next/og';
import { RESTAURANT } from '@maquis18/shared';

/**
 * Social preview image (Facebook, WhatsApp, LinkedIn, X…), generated at build time.
 * Next.js serves it at /opengraph-image and adds the og:image tags automatically.
 */
export const alt = `${RESTAURANT.name} — ${RESTAURANT.tagline}`;
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default function OpengraphImage() {
  return new ImageResponse(
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        padding: '72px 80px',
        background: '#2f4a3a',
        color: '#faf4ea',
      }}
    >
      <div style={{ display: 'flex', fontSize: 40, letterSpacing: 6, textTransform: 'uppercase', color: '#d9a441' }}>
        Cuisine africaine · Paris 18e
      </div>
      <div style={{ display: 'flex', fontSize: 150, fontWeight: 700, lineHeight: 1 }}>
        Maquis&nbsp;<span style={{ color: '#d9a441' }}>18</span>
      </div>
      <div style={{ display: 'flex', fontSize: 40, maxWidth: 900, lineHeight: 1.3 }}>
        Attiéké, foutou, mafé… faits maison, 7 j/7. Réservez votre table en ligne.
      </div>
    </div>,
    size,
  );
}
