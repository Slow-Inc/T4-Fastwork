'use client';

/**
 * Client subscriber that delivers the live-portfolio "double" (#25 R3). The
 * page renders the durable snapshot server-side (instant, stale-OK); this mounts
 * alongside it, subscribes to Supabase Realtime on `github_snapshots` (enabled
 * in R2), and when a watched key changes (an R4 heal upserted genuinely-new
 * data) it busts the matching fetch cache tag and refreshes — the viewer sees
 * fresh data with no reload and no polling. On unmount the channel closes.
 *
 * Fully graceful: no Supabase env, a failed connection, or an empty key list all
 * degrade to "just the server-rendered snapshot" — never an error, never a blank.
 * Renders nothing.
 */
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/client';
import { subscribeSnapshots } from '@/lib/live-snapshot';
import { refreshLiveTags } from '@/lib/live-actions';

export function LiveSnapshot({ keys }: { keys: string[] }) {
  const router = useRouter();
  // Stable primitive dep — a fresh array each render must not re-subscribe.
  const keyList = keys.join('|');

  useEffect(() => {
    const watched = keyList ? keyList.split('|') : [];
    if (watched.length === 0) return;
    // Realtime unavailable (env unset) → stay on the server-rendered snapshot.
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL) return;

    let client;
    try {
      client = createClient();
    } catch {
      return;
    }

    let timer: ReturnType<typeof setTimeout> | null = null;
    const off = subscribeSnapshots(client, watched, () => {
      // Debounce: one heal cycle can upsert several watched keys at once.
      if (timer) clearTimeout(timer);
      timer = setTimeout(async () => {
        try {
          // Server Action: expires the matching gh:* fetch cache tag; its
          // automatic route revalidation re-reads fresh data (the "double").
          await refreshLiveTags(watched);
        } catch {
          // Best-effort; router.refresh() below still re-renders.
        }
        router.refresh();
      }, 400);
    });

    return () => {
      if (timer) clearTimeout(timer);
      off();
    };
  }, [keyList, router]);

  return null;
}
