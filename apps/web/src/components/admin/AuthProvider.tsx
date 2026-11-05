'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import type { AdminProfileDto, LoginRequest, LoginResponse } from '@maquis18/shared';
import { AdminApiError, adminFetch } from '@/lib/admin-api';

const STORAGE_KEY = 'maquis18.admin-session';

type Session = { accessToken: string; admin: AdminProfileDto };

type AuthContextValue = {
  session: Session | null;
  /** false until the stored session has been read (avoids a flash of the login page) */
  isReady: boolean;
  login: (credentials: LoginRequest) => Promise<void>;
  logout: () => void;
  /** adminFetch with the token attached; logs out automatically when the token is rejected */
  request: <T>(path: string, options?: { method?: 'GET' | 'POST' | 'PATCH' | 'DELETE'; body?: unknown }) => Promise<T>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

/*
 * Demo choice: the JWT is kept in localStorage, which is simple to follow.
 * For production, an httpOnly cookie set by the API is safer (JavaScript can't read it).
 */
export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) setSession(JSON.parse(stored) as Session);
    } catch {
      // Storage unavailable (private mode…) or corrupted: start logged out
    }
    setIsReady(true);
  }, []);

  const saveSession = useCallback((next: Session | null) => {
    setSession(next);
    try {
      if (next) localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      else localStorage.removeItem(STORAGE_KEY);
    } catch {
      // Ignore: the session still lives in memory for this tab
    }
  }, []);

  const login = useCallback(
    async (credentials: LoginRequest) => {
      const response = await adminFetch<LoginResponse>('/auth/login', { method: 'POST', body: credentials });
      saveSession({ accessToken: response.accessToken, admin: response.admin });
    },
    [saveSession],
  );

  const logout = useCallback(() => saveSession(null), [saveSession]);

  const request = useCallback<AuthContextValue['request']>(
    async (path, options) => {
      try {
        return await adminFetch(path, { ...options, token: session?.accessToken });
      } catch (error) {
        if (error instanceof AdminApiError && error.status === 401) logout();
        throw error;
      }
    },
    [session?.accessToken, logout],
  );

  const value = useMemo(() => ({ session, isReady, login, logout, request }), [session, isReady, login, logout, request]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth doit être utilisé dans <AuthProvider>');
  return context;
}
