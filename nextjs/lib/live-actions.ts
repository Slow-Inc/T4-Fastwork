'use server';

/**
 * Live-freshness Server Action (#25 R3). Called by the client `<LiveSnapshot>`
 * when Supabase Realtime reports a watched `github_snapshots` row changed (after
 * an R4 heal upsert). It `updateTag`s the matching Next.js fetch cache tag —
 * which immediately expires it so the action's automatic route revalidation
 * re-reads FRESH data (read-your-own-writes), delivering the "double" to the
 * current viewer with no reload. `updateTag` is Server-Action-only, hence this
 * file rather than a Route Handler.
 *
 * Only ever touches `gh:*` tags (via `tagForKey`, which returns null for any
 * other key), so a stray call can at most force a re-read of already-public data.
 */
import { updateTag } from 'next/cache';
import { tagForKey } from './live-snapshot';

export async function refreshLiveTags(keys: string[]): Promise<void> {
  const tags = new Set<string>();
  for (const key of keys) {
    const tag = typeof key === 'string' ? tagForKey(key) : null;
    if (tag) tags.add(tag);
  }
  for (const tag of tags) updateTag(tag);
}
