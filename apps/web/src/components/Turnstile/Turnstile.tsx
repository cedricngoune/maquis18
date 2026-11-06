'use client';

import { useEffect, useRef } from 'react';
import { TURNSTILE_TEST_SITE_KEY } from '@maquis18/shared';

const SCRIPT_ID = 'cf-turnstile-script';
const SCRIPT_SRC = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';
const SITE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY ?? TURNSTILE_TEST_SITE_KEY;

type TurnstileApi = {
  render: (container: HTMLElement, options: Record<string, unknown>) => string;
  reset: (widgetId: string) => void;
  remove: (widgetId: string) => void;
};

declare global {
  interface Window {
    turnstile?: TurnstileApi;
  }
}

/** Loads Cloudflare's script only once, even if several widgets mount */
function loadTurnstileScript(): Promise<TurnstileApi> {
  return new Promise((resolve, reject) => {
    if (window.turnstile) return resolve(window.turnstile);

    let script = document.getElementById(SCRIPT_ID) as HTMLScriptElement | null;
    if (!script) {
      script = document.createElement('script');
      script.id = SCRIPT_ID;
      script.src = SCRIPT_SRC;
      script.async = true;
      script.defer = true;
      document.head.appendChild(script);
    }
    script.addEventListener('load', () => (window.turnstile ? resolve(window.turnstile) : reject(new Error('Turnstile indisponible'))));
    script.addEventListener('error', () => reject(new Error('Turnstile indisponible')));
  });
}

type TurnstileProps = {
  /** Receives the token when the check succeeds, and null when it expires or fails */
  onTokenChange: (token: string | null) => void;
  /** Change this number to get a fresh token (a token can only be used once) */
  resetKey: number;
};

/** Cloudflare Turnstile anti-bot check: usually invisible, sometimes a single click */
export function Turnstile({ onTokenChange, resetKey }: TurnstileProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const widgetIdRef = useRef<string | null>(null);
  // Keeps the latest callback without re-rendering the widget
  const onTokenChangeRef = useRef(onTokenChange);
  onTokenChangeRef.current = onTokenChange;

  useEffect(() => {
    let isMounted = true;

    loadTurnstileScript()
      .then((turnstile) => {
        if (!isMounted || !containerRef.current || widgetIdRef.current) return;
        widgetIdRef.current = turnstile.render(containerRef.current, {
          sitekey: SITE_KEY,
          language: 'fr',
          theme: 'light',
          callback: (token: string) => onTokenChangeRef.current(token),
          'expired-callback': () => onTokenChangeRef.current(null),
          'error-callback': () => onTokenChangeRef.current(null),
        });
      })
      .catch(() => onTokenChangeRef.current(null));

    return () => {
      isMounted = false;
      if (widgetIdRef.current) window.turnstile?.remove(widgetIdRef.current);
      widgetIdRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (resetKey > 0 && widgetIdRef.current) {
      onTokenChangeRef.current(null);
      window.turnstile?.reset(widgetIdRef.current);
    }
  }, [resetKey]);

  return <div ref={containerRef} />;
}
