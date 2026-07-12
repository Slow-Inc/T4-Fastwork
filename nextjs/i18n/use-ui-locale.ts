'use client';

import { useState, useEffect } from 'react';
import { LOCALE_COOKIE, resolveLocale, type Locale } from './locale';

/**
 * Client-side UI locale (Requirement §7.1) kept out of the server render so the
 * pages stay statically generated. Reads/writes the NEXT_LOCALE cookie; the
 * server always renders the Thai default, the client swaps chrome after mount.
 */
export function useUiLocale(): [Locale, (l: Locale) => void] {
  const [locale, setLocale] = useState<Locale>('th');

  useEffect(() => {
    const match = document.cookie.match(new RegExp(`${LOCALE_COOKIE}=([^;]+)`));
    // Cookie is only readable client-side, so syncing after mount is intentional.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLocale(resolveLocale(match?.[1]));
  }, []);

  const set = (l: Locale) => {
    document.cookie = `${LOCALE_COOKIE}=${l}; path=/; max-age=${60 * 60 * 24 * 365}`;
    setLocale(l);
  };

  return [locale, set];
}
