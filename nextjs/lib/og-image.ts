/**
 * Extract a page's social-preview image (spec 2026-07-14, P4 / #161).
 * Cheap cover fallback when Playwright capture fails: parse `og:image`
 * (then `twitter:image`) and resolve to an absolute URL. Pure + unit-tested.
 * Mirrors nestjs/src/github/og-image.ts so the Action worker can stay in nextjs/.
 */

function metaContent(html: string, key: string): string | null {
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
