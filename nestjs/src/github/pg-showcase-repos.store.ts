import { Inject, Injectable } from '@nestjs/common';
import { sql } from 'drizzle-orm';
import { DRIZZLE, type DrizzleDB } from '../database/database.module';
import type { ShowcaseRepoProvider } from './github-refresh.service';

/**
 * Postgres-backed ShowcaseRepoProvider over the Drizzle pooler (mirrors
 * PgGenerateStore / PgRankStore). Returns the `{owner, repo}` set the refresh
 * fetches detail (contributors/pulls/README) for — every PUBLISHED github-backed
 * project, not just the hardcoded MangaDock (T2.4). Draft/hidden and non-github
 * rows are excluded, so unpublished repos never leak a live overlay.
 */
@Injectable()
export class PgShowcaseRepoStore implements ShowcaseRepoProvider {
  constructor(@Inject(DRIZZLE) private readonly db: DrizzleDB) {}

  async listShowcaseRepos(): Promise<{ owner: string; repo: string }[]> {
    const rows = (await this.db.execute(
      sql`select gh_owner, gh_repo
          from projects
          where source = 'github'
            and status = 'published'
            and gh_owner is not null
            and gh_repo is not null`,
    )) as Array<Record<string, unknown>>;
    return rows
      .filter(
        (r) => typeof r.gh_owner === 'string' && typeof r.gh_repo === 'string',
      )
      .map((r) => ({ owner: String(r.gh_owner), repo: String(r.gh_repo) }));
  }
}
