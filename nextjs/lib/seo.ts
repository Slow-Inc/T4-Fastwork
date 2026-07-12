/**
 * Self-referencing hreflang alternates (Requirement §8.1). Locale switching is
 * client-side (a cookie, not a routed `/th`/`/en` path — see i18n/locale-context),
 * so there is no distinct URL per language; every page declares itself as the
 * alternate for both th and en rather than omitting hreflang entirely.
 */
export function pageAlternates(path = '/') {
  return {
    canonical: path,
    languages: {
      th: path,
      en: path,
      'x-default': path,
    },
  };
}
