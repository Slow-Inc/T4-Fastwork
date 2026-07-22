import { Inject, Injectable } from '@nestjs/common';
import { isNotNull, sql } from 'drizzle-orm';
import { DRIZZLE, type DrizzleDB } from '../database/database.module';
import { members, memberProjects } from '../database/schema';
import type {
  MemberProjectStore,
  MemberProjectRow,
  MemberWithLogin,
} from './github-member-sync';

/**
 * Thin Postgres adapter for the member-projects sync (Drizzle pooler, bypasses RLS).
 * Reads the members that have a GitHub login, and upserts their public repos into
 * member_projects keyed on (member_id, url) (unique — 0025): content is refreshed while
 * the human-curated `selected` / `sort_order` are preserved (not in the update set).
 */
@Injectable()
export class PgMemberProjectStore implements MemberProjectStore {
  constructor(@Inject(DRIZZLE) private readonly db: DrizzleDB) {}

  async getMembersWithLogin(): Promise<MemberWithLogin[]> {
    const rows = await this.db
      .select({ id: members.id, login: members.githubLogin })
      .from(members)
      .where(isNotNull(members.githubLogin));
    return rows
      .filter((r): r is { id: number; login: string } => Boolean(r.login))
      .map((r) => ({ id: r.id, login: r.login }));
  }

  async upsertMemberProjects(rows: MemberProjectRow[]): Promise<void> {
    if (rows.length === 0) return;
    await this.db
      .insert(memberProjects)
      .values(
        rows.map((r) => ({
          memberId: r.memberId,
          name: r.name,
          description: r.description,
          url: r.url,
          tech: r.tech,
          year: r.year,
          selected: false, // new repos start hidden; the admin picks which to show
        })),
      )
      .onConflictDoUpdate({
        target: [memberProjects.memberId, memberProjects.url],
        set: {
          name: sql`excluded.name`,
          description: sql`excluded.description`,
          tech: sql`excluded.tech`,
          year: sql`excluded.year`,
          // selected + sort_order deliberately NOT updated → preserve the admin's curation
        },
      });
  }
}
