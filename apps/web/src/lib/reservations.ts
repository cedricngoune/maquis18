import type { ApiErrorResponse, CreateReservationRequest, ReservationDto } from '@maquis18/shared';

const PUBLIC_API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:5000';

export type CreateReservationResult =
  | { ok: true; reservation: ReservationDto }
  | { ok: false; error: ApiErrorResponse };

/** Called from the browser: sends the form to POST /reservations */
export async function createReservation(request: CreateReservationRequest): Promise<CreateReservationResult> {
  try {
    const response = await fetch(`${PUBLIC_API_URL}/reservations`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(request),
    });

    if (response.ok) {
      return { ok: true, reservation: (await response.json()) as ReservationDto };
    }

    const error = (await response.json().catch(() => null)) as ApiErrorResponse | null;
    return {
      ok: false,
      error: error ?? { statusCode: response.status, message: 'Une erreur est survenue. Merci de réessayer.' },
    };
  } catch {
    return {
      ok: false,
      error: { statusCode: 0, message: 'Impossible de joindre le serveur. Vérifiez votre connexion et réessayez.' },
    };
  }
}
