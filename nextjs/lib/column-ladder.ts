/**
 * Remember which column set the database actually accepts, so a fallback ladder pays its failed
 * attempts once per process instead of once per request (#207).
 *
 * Why this exists: the ladders from #198 are the right mitigation for the window between deploying
 * code and applying a migration, but that window is open indefinitely while 0032/0033 wait for
 * authorization. Measured on production, `/projects` spent **3.2–3.7 s on every uncached read**
 * walking three failing selects before the one that works. This removes that cost without touching
 * the database — which is why #207 lists it as worth doing whichever auto-migrate option wins.
 */

/**
 * How long a remembered winner is trusted.
 *
 * Not indefinite, and that is the point: when a migration finally lands, a richer column set starts
 * succeeding, but a long-lived process would keep using the poorer set it memoised and the new column
 * would stay invisible until a cold start. Since #207 exists to stop a migration from needing a
 * human, requiring a redeploy to *see* one would put the human back. Ten minutes bounds the stale
 * window while still collapsing the per-request cost to roughly nothing.
 */
export const LADDER_MEMO_TTL_MS = 10 * 60_000;

export interface ColumnLadder<T> {
  /** The attempts to try, remembered winner first while the memo is fresh. */
  order(): readonly T[];
  /** Record the attempt that succeeded. Ignored when it is not one of the attempts. */
  remember(winner: T): void;
}

export function createColumnLadder<T>(
  attempts: readonly T[],
  opts?: { now?: () => number; ttlMs?: number },
): ColumnLadder<T> {
  const now = opts?.now ?? Date.now;
  const ttlMs = opts?.ttlMs ?? LADDER_MEMO_TTL_MS;
  let winner: T | null = null;
  let rememberedAt = 0;

  return {
    order() {
      if (winner === null || now() - rememberedAt > ttlMs) return attempts;
      // Every other attempt stays available: if the remembered set starts failing, the caller must
      // still be able to walk the rest rather than give up on one error.
      return [winner, ...attempts.filter((a) => a !== winner)];
    },
    remember(candidate: T) {
      if (!attempts.includes(candidate)) return;
      winner = candidate;
      rememberedAt = now();
    },
  };
}
