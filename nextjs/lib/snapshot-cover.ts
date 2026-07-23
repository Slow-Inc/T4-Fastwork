/**
 * Pure helpers for the screenshot worker (#161): eligibility + OG fallback
 * when Playwright capture is unusable. Keeps the Action script thin.
 */
import { extractOgImage } from './og-image';

export function isCaptureUsable(
  bytes: Uint8Array | null,
  minBytes: number,
): boolean {
  return bytes != null && bytes.byteLength >= minBytes;
}

/** When capture is bad, return an absolute social-preview URL — else null. */
export function resolveOgFallbackUrl(opts: {
  captureUsable: boolean;
  html: string | null;
  pageUrl: string;
}): string | null {
  if (opts.captureUsable) return null;
  if (!opts.html) return null;
  return extractOgImage(opts.html, opts.pageUrl);
}

export type SnapshotRow = {
  id: number;
  slug: string;
  status: string;
  live_url: string | null;
  snapshot_image: string | null;
};

export type SnapshotTarget = {
  id: number;
  slug: string;
  live_url: string;
};

/** Published + non-blank live_url + null snapshot (defense in depth vs SQL). */
export function selectSnapshotTargets(rows: SnapshotRow[]): SnapshotTarget[] {
  const out: SnapshotTarget[] = [];
  for (const row of rows) {
    if (row.status !== 'published') continue;
    if (row.snapshot_image != null) continue;
    const live = row.live_url?.trim() ?? '';
    if (!live) continue;
    out.push({ id: row.id, slug: row.slug, live_url: live });
  }
  return out;
}
