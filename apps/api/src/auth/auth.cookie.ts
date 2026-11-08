import type { CookieOptions } from 'express';

/** Name of the session cookie holding the admin JWT */
export const ADMIN_SESSION_COOKIE = 'maquis18_admin';

/**
 * - httpOnly: JavaScript cannot read the cookie, so an XSS flaw cannot steal the session
 * - secure: sent over HTTPS only (disabled locally, where the site runs on http://localhost)
 * - sameSite "lax": not sent with requests initiated by other sites (CSRF protection).
 *   The site and the API must share the same site: localhost:3001 / localhost:5000 locally,
 *   maquis18.example.com / api.maquis18.example.com in production.
 */
export function sessionCookieOptions(expiresAt?: Date): CookieOptions {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    ...(expiresAt && { expires: expiresAt }),
  };
}
