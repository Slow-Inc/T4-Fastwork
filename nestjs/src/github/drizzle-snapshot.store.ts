/**
 * Supabase-backed snapshot store (ADR 0003). One class satisfies both the write
 * side (`SnapshotStore`, used by the ETag sync) and the read side
 * (`SnapshotReader`, used by the read service) over the `github_snapshots`
 * table. Upsert is a single `INSERT … ON CONFLICT DO UPDATE` keyed on `key`.
 *
 * Integration-tested against a real Supabase pooler is a follow-up (needs
 * DATABASE_URL) — this adapter is intentionally thin; the logic that has
 * behavior lives in the unit-tested services.
 */
import { Inject, Injectable } from '@nestjs/common';
import { eq, sql } from 'drizzle-orm';
import { DRIZZLE, type DrizzleDB } from '../database/database.module';
import { githubSnapshots } from '../database/schema';
import type { SnapshotStore } from './github.service';
import type { SnapshotReader } from './github-read.service';
import type { DeliveryDedup } from './github-webhook.service';

@Injectable()
export class DrizzleSnapshotStore
  implements SnapshotStore, SnapshotReader, DeliveryDedup
{
  constructor(@Inject(DRIZZLE) private readonly db: DrizzleDB) {}

  /**
   * Idempotency for webhooks: atomically claim a delivery id by inserting a
   * marker row (reusing `github_snapshots` with a `delivery:<id>` key). If the
   * insert is a no-op (row already there) the delivery was already processed.
   */
  async seenBefore(deliveryId: string): Promise<boolean> {
    const inserted = await this.db
      .insert(githubSnapshots)
      .values({
        key: `delivery:${deliveryId}`,
        data: {},
        etag: null,
        updatedAt: new Date(),
      })
      .onConflictDoNothing({ target: githubSnapshots.key })
      .returning({ key: githubSnapshots.key });
    return inserted.length === 0;
  }

  /**
   * Single-flight guard (spec P2): run `fn` only if this process wins a
   * transaction-scoped advisory lock — safe through the Supavisor transaction
   * pooler (session-level locks are NOT). A loser skips instead of blocking, so
   * overlapping crons never double-fetch GitHub.
   */
  async runExclusive<T>(
    lockName: string,
    fn: () => Promise<T>,
  ): Promise<{ ran: true; result: T } | { ran: false }> {
    return this.db.transaction(async (tx) => {
      const rows = await tx.execute<{ locked: boolean }>(
        sql`select pg_try_advisory_xact_lock(hashtext(${lockName})) as locked`,
      );
      const locked = (rows as unknown as { locked: boolean }[])[0]?.locked;
      if (!locked) return { ran: false as const };
      return { ran: true as const, result: await fn() };
    });
  }

  async read(
    key: string,
  ): Promise<{ data: unknown; etag: string | null; updatedAt: Date } | null> {
    const [row] = await this.db
      .select()
      .from(githubSnapshots)
      .where(eq(githubSnapshots.key, key))
      .limit(1);
    if (!row) return null;
    return { data: row.data, etag: row.etag, updatedAt: row.updatedAt };
  }

  async upsert(row: {
    key: string;
    data: unknown;
    etag: string | null;
    pushedAt?: Date | null;
  }): Promise<void> {
    const now = new Date();
    await this.db
      .insert(githubSnapshots)
      .values({
        key: row.key,
        data: row.data,
        etag: row.etag,
        pushedAt: row.pushedAt ?? null,
        updatedAt: now,
      })
      .onConflictDoUpdate({
        target: githubSnapshots.key,
        set: {
          data: row.data,
          etag: row.etag,
          pushedAt: row.pushedAt ?? null,
          updatedAt: now,
        },
      });
  }
}
