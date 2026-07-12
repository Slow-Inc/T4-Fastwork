'use client';

import { createContext, useContext } from 'react';
import { useUiLocale } from './use-ui-locale';
import type { Locale } from './locale';

interface LocaleCtx {
  locale: Locale;
  setLocale: (l: Locale) => void;
}

const Ctx = createContext<LocaleCtx>({ locale: 'th', setLocale: () => {} });

/**
 * Client locale provider (Requirement §7.1). Keeps the whole tree statically
 * rendered (server emits the Thai default); content components read `useLocale`
 * and swap to EN client-side via the NEXT_LOCALE cookie. One source of truth for
 * the nav switch and every localized content component.
 */
export function LocaleProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocale] = useUiLocale();
  return <Ctx.Provider value={{ locale, setLocale }}>{children}</Ctx.Provider>;
}

export function useLocale() {
  return useContext(Ctx);
}

/** Pick the value for the active locale. */
export function useT<T>(th: T, en: T): T {
  const { locale } = useLocale();
  return locale === 'en' ? en : th;
}
