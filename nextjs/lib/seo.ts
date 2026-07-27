/**
 * Self-referencing hreflang alternates (Requirement §8.1). Locale switching is
 * client-side (a cookie, not a routed `/th`/`/en` path — see i18n/locale-context),
 * so there is no distinct URL per language; every page declares itself as the
 * alternate for both th and en rather than omitting hreflang entirely.
 */
/**
 * Serialise a JSON-LD payload for `dangerouslySetInnerHTML` (#265).
 *
 * `JSON.stringify` alone is not safe here. Inside a `<script>` element the HTML parser is in
 * script-data state, so nothing in the payload is entity-decoded — but a literal `</script>` in a
 * string value **ends the element**, and everything after it is parsed as markup. `JSON.stringify`
 * does not escape `<`, and these payloads carry taxonomy names, titles and descriptions that the
 * content generator writes from model output, so the values are not all author-controlled.
 *
 * Escaping `<`, `>` and `&` to their `\uXXXX` forms keeps the output valid JSON — `JSON.parse` and
 * every schema consumer still read the original string — while making it impossible for any value to
 * close the element. `>` and `&` are not strictly required in script-data state; they are escaped
 * anyway so the same helper is safe if a caller ever puts the result somewhere that does decode
 * entities.
 *
 * The parameter is `object` rather than `unknown` on purpose: `JSON.stringify(undefined)` returns
 * `undefined`, and `.replace` on that throws — a 500 on a public page. `object` accepts both a schema
 * object and the root layout's array while rejecting `undefined`/`null`/primitives at compile time,
 * which is cheaper than a runtime guard for a case no caller should be able to reach.
 */
export function jsonLdHtml(data: object): string {
  return JSON.stringify(data)
    .replace(/</g, '\\u003c')
    .replace(/>/g, '\\u003e')
    .replace(/&/g, '\\u0026');
}

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
