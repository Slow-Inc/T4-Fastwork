import { Inject, Injectable } from '@nestjs/common';
import { sql } from 'drizzle-orm';
import { DRIZZLE, type DrizzleDB } from '../database/database.module';
import type { RankStore, RankCandidate, RankRow, RankKind } from './rank';

/** Safe scalar-to-string for `unknown` DB values (never stringifies an object). */
function asString(v: unknown): string {
  if (v == null) return '';
  if (typeof v === 'string') return v;
  if (
    typeof v === 'number' ||
    typeof v === 'bigint' ||
    typeof v === 'boolean'
  ) {
    return String(v);
  }
  if (v instanceof Date) return v.toISOString();
  return '';
}

/**
 * Postgres-backed RankStore over the same Drizzle pooler connection. `projects`
 * is a Drizzle table; `certificates`/`blog_posts` are Supabase-only, so all three
 * use raw parameterised SQL for uniformity. Thin adapter — the behaviour lives in
 * the unit-tested `RankService`/`rank.ts`; verified against the live DB.
 */
@Injectable()
export class PgRankStore implements RankStore {
  constructor(@Inject(DRIZZLE) private readonly db: DrizzleDB) {}

  async getCandidates(kind: RankKind): Promise<RankCandidate[]> {
    const rows = (await this.db.execute(this.selectSql(kind))) as Array<
      Record<string, unknown>
    >;
    return rows.map((r) => ({
      id: asString(r.id),
      title: asString(r.title),
      signals: this.signals(kind, r),
    }));
  }

  async applyRanks(kind: RankKind, rows: RankRow[]): Promise<void> {
    if (rows.length === 0) return;
    const table = TABLE[kind];
    const key = KEY[kind];
    // One transaction so a mid-loop failure never leaves ranks half-updated.
    await this.db.transaction(async (tx) => {
      for (const row of rows) {
        const id = key === 'id' ? sql`${row.id}::bigint` : sql`${row.id}`;
        await tx.execute(
          sql`update ${sql.raw(table)} set ai_rank = ${row.aiRank}, ai_rank_rationale = ${row.aiRankRationale ?? null} where ${sql.raw(key)} = ${id}`,
        );
      }
    });
  }

  private selectSql(kind: RankKind) {
    switch (kind) {
      case 'projects':
        return sql`select slug as id, title, is_featured, published_at from projects where status = 'published'`;
      case 'certificates':
        return sql`select id::text as id, title, issuer, issued_year from certificates`;
      case 'blog':
        return sql`select slug as id, title, views, published_at from blog_posts where published_at is not null`;
      case 'team_projects':
        return sql`select id::text as id, name as title, year, contributors from team_projects`;
    }
  }

  private signals(
    kind: RankKind,
    r: Record<string, unknown>,
  ): Record<string, string | number> {
    switch (kind) {
      case 'projects':
        return {
          isFeatured: r.is_featured ? 1 : 0,
          publishedAt: asString(r.published_at),
        };
      case 'certificates':
        return {
          issuer: asString(r.issuer),
          year: Number(r.issued_year ?? 0),
        };
      case 'blog':
        return {
          views: Number(r.views ?? 0),
          publishedAt: asString(r.published_at),
        };
      case 'team_projects':
        return {
          year: Number(r.year ?? 0),
          contributors: Array.isArray(r.contributors)
            ? r.contributors.length
            : 0,
        };
    }
  }
}

const TABLE: Record<RankKind, string> = {
  projects: 'projects',
  certificates: 'certificates',
  blog: 'blog_posts',
  team_projects: 'team_projects',
};

const KEY: Record<RankKind, string> = {
  projects: 'slug',
  certificates: 'id',
  blog: 'slug',
  team_projects: 'id',
};
