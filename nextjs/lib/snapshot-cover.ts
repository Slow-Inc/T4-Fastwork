/**
 * Pure helpers for the screenshot worker (#161 / #190): eligibility + OG
 * fallback when Playwright capture is unusable. Keeps the Action script thin.
 */
import { extractOgImage } from './og-image';
// Cross-workspace import on purpose: the capture rule has exactly one home, shared with the
// Nest planner (#197). This module is only consumed by scripts/screenshot-projects.ts, which
// the screenshot Action runs under Bun — it is not part of the deployed app's runtime graph.
import { needsCoverCapture } from '../../nestjs/src/github/capture-eligibility';

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
  last_capture_trigger?: string | null;
};

export type SnapshotTarget = {
  id: number;
  slug: string;
  live_url: string;
};

export type SelectSnapshotOpts = {
  /** Limit to one slug (workflow_dispatch / pipeline). */
  slug?: string;
  /** Incoming capture trigger — recapture when different from last. */
  trigger?: string;
  /** Bypass trigger/image gates for the selected slug. */
  force?: boolean;
};

/**
 * Published + non-blank live_url, and either:
 * - missing snapshot_image, or
 * - force, or
 * - incoming trigger differs from last_capture_trigger.
 */
export function selectSnapshotTargets(
  rows: SnapshotRow[],
  opts: SelectSnapshotOpts = {},
): SnapshotTarget[] {
  const out: SnapshotTarget[] = [];
  for (const row of rows) {
    if (opts.slug && row.slug !== opts.slug) continue;
    if (row.status !== 'published') continue;
    const live = row.live_url?.trim() ?? '';
    if (!live) continue;

    const needsCapture = needsCoverCapture({
      hasCover: row.snapshot_image != null,
      lastCompletedTrigger: row.last_capture_trigger ?? null,
      incomingTrigger: opts.trigger ?? null,
      force: opts.force === true,
    });

    if (!needsCapture) continue;
    out.push({ id: row.id, slug: row.slug, live_url: live });
  }
  return out;
}
