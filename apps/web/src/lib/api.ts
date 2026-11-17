import { DEFAULT_OPENING_HOURS, type MenuDto, type OpeningHourDto } from '@maquis18/shared';

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

/**
 * Opening hours, refreshed every 60 s like the menu.
 * Falls back to the default week if the API is unreachable, so the site never shows empty hours.
 */
export async function fetchOpeningHours(): Promise<OpeningHourDto[]> {
  try {
    const response = await fetch(`${API_URL}/opening-hours`, { next: { revalidate: 60 } });
    if (!response.ok) {
      console.error(`Impossible de charger les horaires (${response.status})`);
      return DEFAULT_OPENING_HOURS;
    }
    return (await response.json()) as OpeningHourDto[];
  } catch (error) {
    console.error('API injoignable :', error);
    return DEFAULT_OPENING_HOURS;
  }
}
