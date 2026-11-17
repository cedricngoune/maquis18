import type {
  ApiErrorResponse,
  CreateReservationRequest,
  ManageReservationDto,
  ReservationDto,
} from '@maquis18/shared';

const PUBLIC_API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:5000';

export type CreateReservationResult =
  { ok: true; reservation: ReservationDto } | { ok: false; error: ApiErrorResponse };

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

export type ManageResult = { ok: true; reservation: ManageReservationDto } | { ok: false; error: ApiErrorResponse };

/** Reads (GET) or cancels (POST) the reservation behind a cancellation link */
async function manageRequest(token: string, action: 'read' | 'cancel'): Promise<ManageResult> {
  const path = `/reservations/manage/${encodeURIComponent(token)}${action === 'cancel' ? '/cancel' : ''}`;
  try {
    const response = await fetch(`${PUBLIC_API_URL}${path}`, { method: action === 'cancel' ? 'POST' : 'GET' });
    const data = await response.json().catch(() => null);
    if (response.ok) return { ok: true, reservation: data as ManageReservationDto };
    return {
      ok: false,
      error: (data as ApiErrorResponse | null) ?? { statusCode: response.status, message: 'Une erreur est survenue.' },
    };
  } catch {
    return {
      ok: false,
      error: { statusCode: 0, message: 'Impossible de joindre le serveur. Réessayez dans un instant.' },
    };
  }
}

export const fetchReservationByToken = (token: string) => manageRequest(token, 'read');
export const cancelReservationByToken = (token: string) => manageRequest(token, 'cancel');
