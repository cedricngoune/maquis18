import type { MenuDto } from '@maquis18/shared';

const API_URL = process.env.API_URL ?? 'http://localhost:5000';

/**
 * Fetches the menu; Next.js re-fetches it at most every 60 s (ISR).
 * Returns an empty menu when the API is unreachable (e.g. during `next build`),
 * so the site still builds and the next revalidation fills it in.
 */
export async function fetchMenu(): Promise<MenuDto> {
  try {
    const response = await fetch(`${API_URL}/menu`, { next: { revalidate: 60 } });
    if (!response.ok) {
      console.error(`Impossible de charger la carte (${response.status})`);
      return [];
    }
    return (await response.json()) as MenuDto;
  } catch (error) {
    console.error('API injoignable :', error);
    return [];
  }
}
