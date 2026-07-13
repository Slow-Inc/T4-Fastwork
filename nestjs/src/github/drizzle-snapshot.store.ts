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
import { eq } from 'drizzle-orm';
import { DRIZZLE, type DrizzleDB } from '../database/database.module';
import { githubSnapshots } from '../database/schema';
import type { SnapshotStore } from './github.service';
import type { SnapshotReader } from './github-read.service';

@Injectable()
export class DrizzleSnapshotStore implements SnapshotStore, SnapshotReader {
  constructor(@Inject(DRIZZLE) private readonly db: DrizzleDB) {}

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
