'use server';

import { cookies } from 'next/headers';
import { revalidatePath } from 'next/cache';
import { LOCALE_COOKIE, resolveLocale } from './locale';

/** Flip the UI language (Requirement §7.1). Persists in the NEXT_LOCALE cookie. */
export async function toggleLocale() {
  const store = await cookies();
  const current = resolveLocale(store.get(LOCALE_COOKIE)?.value);
  const next = current === 'th' ? 'en' : 'th';
  store.set(LOCALE_COOKIE, next, {
    path: '/',
    maxAge: 60 * 60 * 24 * 365,
  });
  revalidatePath('/', 'layout');
}
