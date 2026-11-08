import type { ApiErrorResponse } from '@maquis18/shared';

const PUBLIC_API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:5000';

/** Error thrown for any non-2xx answer; `body.errors` holds per-field messages when there are some */
export class AdminApiError extends Error {
  constructor(
    public readonly status: number,
    public readonly body: ApiErrorResponse,
  ) {
    super(body.message);
  }
}

export type RequestOptions = {
  method?: 'GET' | 'POST' | 'PATCH' | 'DELETE';
  body?: unknown;
};

/**
 * credentials: 'include' makes the browser send (and store) the httpOnly session cookie
 * set by the API. This code never sees the token itself.
 */
export async function adminFetch<T>(path: string, { method = 'GET', body }: RequestOptions = {}): Promise<T> {
  let response: Response;
  try {
    response = await fetch(`${PUBLIC_API_URL}${path}`, {
      method,
      credentials: 'include',
      headers: body !== undefined ? { 'Content-Type': 'application/json' } : undefined,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw new AdminApiError(0, { statusCode: 0, message: 'Impossible de joindre le serveur.' });
  }

  if (response.status === 204) {
    return undefined as T;
  }

  const data = await response.json().catch(() => null);
  if (!response.ok) {
    // Nest returns either our { message, errors } shape or its default { message: string | string[] }
    const message = Array.isArray(data?.message) ? data.message[0] : data?.message;
    throw new AdminApiError(response.status, {
      statusCode: response.status,
      message: message ?? 'Une erreur est survenue.',
      errors: data?.errors,
    });
  }
  return data as T;
}
