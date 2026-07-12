import { getRequestConfig } from 'next-intl/server';
import { cookies } from 'next/headers';
import { resolveLocale, LOCALE_COOKIE } from './locale';

/**
 * Cookie-based locale (no locale routing) so existing routes are untouched
 * (Requirement §7.1). The language switcher sets NEXT_LOCALE; default is Thai.
 */
export default getRequestConfig(async () => {
  const cookieStore = await cookies();
  const locale = resolveLocale(cookieStore.get(LOCALE_COOKIE)?.value);
  const messages = (await import(`../messages/${locale}.json`)).default;
  return { locale, messages };
});
