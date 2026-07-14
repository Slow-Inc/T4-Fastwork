/**
 * Stale-while-heal single-flight (spec 2026-07-14, ADR 0004, R1). One heal =
 * fetch a resource from GitHub (ETag-aware) and upsert its snapshot; the upsert
 * is what Supabase Realtime broadcasts to subscribed viewers (no explicit
 * broadcast call needed — Postgres logical replication drives it).
 *
 * Single-flight reuses the store's existing `runExclusive` — a
 * `pg_try_advisory_xact_lock` held for one transaction, which IS safe through
 * the Supavisor transaction pooler (session-level locks are not). A loser skips
 * with `{ healing: true }` instead of blocking; its viewers still get the result
 * via their Realtime subscription when the winner upserts.
 */

export interface ResourceSyncer {
  syncResource(
    key: string,
    url: string,
    opts?: { map?: (data: unknown) => unknown },
  ): Promise<{ changed: boolean; data: unknown }>;
}

/** Single-flight primitive (satisfied by DrizzleSnapshotStore, spec P2). */
export interface SingleFlight {
  runExclusive<T>(
    lockName: string,
    fn: () => Promise<T>,
  ): Promise<{ ran: true; result: T } | { ran: false }>;
}

export class GithubHealService {
  constructor(
    private readonly syncer: ResourceSyncer,
    private readonly flight: SingleFlight,
  ) {}

  /**
   * Heal one snapshot key. If another heal for the same key is in flight, this
   * returns `{ healing: true }` without a GitHub call. On a `304` the underlying
   * sync reports `changed: false`, so nothing is upserted and nothing is
   * broadcast — the genuinely-new gate.
   */
  async heal(
    key: string,
    url: string,
    opts?: { map?: (data: unknown) => unknown },
  ): Promise<{ healing: boolean; changed: boolean }> {
    const outcome = await this.flight.runExclusive(`heal:${key}`, () =>
      this.syncer.syncResource(key, url, opts),
    );
    if (!outcome.ran) return { healing: true, changed: false };
    return { healing: false, changed: outcome.result.changed };
  }
}
