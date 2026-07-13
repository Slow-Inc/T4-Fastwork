/**
 * Extract a page's social-preview image (spec 2026-07-14, P4). The cheap,
 * immediate cover-image fallback before (or instead of) a Playwright
 * screenshot: parse `og:image` (then `twitter:image`) from fetched HTML and
 * resolve it to an absolute URL. Pure + unit-tested.
 */

function metaContent(html: string, key: string): string | null {
  // property="key" or name="key", content in either attribute order.
  const patterns = [
    new RegExp(
      `<meta[^>]+(?:property|name)=["']${key}["'][^>]*\\scontent=["']([^"']+)["']`,
      'i',
    ),
    new RegExp(
      `<meta[^>]+content=["']([^"']+)["'][^>]*(?:property|name)=["']${key}["']`,
      'i',
    ),
  ];
  for (const re of patterns) {
    const m = html.match(re);
    if (m) return m[1];
  }
  return null;
}

/** The absolute og:image (or twitter:image) URL for `pageUrl`, or null. */
export function extractOgImage(html: string, pageUrl: string): string | null {
  const raw =
    metaContent(html, 'og:image') ?? metaContent(html, 'twitter:image');
  if (!raw) return null;
  try {
    return new URL(raw, pageUrl).toString();
  } catch {
    return null;
  }
}
