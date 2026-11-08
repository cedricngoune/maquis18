'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import type { AdminProfileDto, LoginRequest, LoginResponse } from '@maquis18/shared';
import { AdminApiError, adminFetch, type RequestOptions } from '@/lib/admin-api';

type Session = { admin: AdminProfileDto };

type AuthContextValue = {
  session: Session | null;
  /** false until the API has told us whether a session exists (avoids a flash of the login page) */
  isReady: boolean;
  login: (credentials: LoginRequest) => Promise<void>;
  logout: () => Promise<void>;
  /** adminFetch that ends the session when the API answers 401 (expired or missing cookie) */
  request: <T>(path: string, options?: RequestOptions) => Promise<T>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

/*
 * The JWT lives in an httpOnly cookie set by the API: JavaScript can't read it,
 * so this provider only keeps the admin profile. On load, it asks GET /auth/me
 * whether the browser still has a valid session cookie.
 */
export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    let isMounted = true;
    adminFetch<AdminProfileDto>('/auth/me')
      .then((admin) => isMounted && setSession({ admin }))
      .catch(() => isMounted && setSession(null)) // 401 = not logged in, anything else = treat as logged out
      .finally(() => isMounted && setIsReady(true));
    return () => {
      isMounted = false;
    };
  }, []);

  const login = useCallback(async (credentials: LoginRequest) => {
    const { admin } = await adminFetch<LoginResponse>('/auth/login', { method: 'POST', body: credentials });
    setSession({ admin });
  }, []);

  const logout = useCallback(async () => {
    try {
      await adminFetch<void>('/auth/logout', { method: 'POST' }); // the API deletes the cookie
    } finally {
      setSession(null);
    }
  }, []);

  const request = useCallback<AuthContextValue['request']>(async (path, options) => {
    try {
      return await adminFetch(path, options);
    } catch (error) {
      if (error instanceof AdminApiError && error.status === 401) setSession(null);
      throw error;
    }
  }, []);

  const value = useMemo(
    () => ({ session, isReady, login, logout, request }),
    [session, isReady, login, logout, request],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth doit être utilisé dans <AuthProvider>');
  return context;
}
