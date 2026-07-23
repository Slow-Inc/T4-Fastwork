/**
 * Normalize GitHub repo Website (homepage) → projects.live_url.
 * Mirrors Nest `mapRepoMetadata` (scheme-less → https://; empty → null).
 */
export function normalizeHomepageToLiveUrl(
  homepage: string | null | undefined,
): string | null {
  const t = (homepage ?? '').trim();
  if (!t) return null;
  return /^https?:\/\//i.test(t) ? t : `https://${t}`;
}
