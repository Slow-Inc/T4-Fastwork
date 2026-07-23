import { Inject, Injectable } from '@nestjs/common';
import { sql } from 'drizzle-orm';
import { DRIZZLE, type DrizzleDB } from '../database/database.module';
import type { ShowcaseRepoProvider } from './github-refresh.service';

/** Lookup a published project slug from its GitHub identity (#143). */
export interface ProjectGithubSlugLookup {
  findPublishedSlugByGithub(
    owner: string,
    repo: string,
  ): Promise<string | null>;
}

/**
 * Postgres-backed ShowcaseRepoProvider over the Drizzle pooler (mirrors
 * PgGenerateStore / PgRankStore). Returns the `{owner, repo}` set the refresh
 * fetches detail (contributors/pulls/README) for — every PUBLISHED github-backed
 * project, not just the hardcoded MangaDock (T2.4). Draft/hidden and non-github
 * rows are excluded, so unpublished repos never leak a live overlay.
 */
@Injectable()
export class PgShowcaseRepoStore
  implements ShowcaseRepoProvider, ProjectGithubSlugLookup
{
  constructor(@Inject(DRIZZLE) private readonly db: DrizzleDB) {}

  async listShowcaseRepos(): Promise<{ owner: string; repo: string }[]> {
    // Mirror the public /projects predicate (projects-repo.getAllProjects):
    // published AND published_at set — a status='published' row with a null
    // published_at is not publicly visible, so it should not be detail-synced.
    // Ordered so the 50-cap in the refresh keeps a deterministic, priority set
    // (featured first, then most recently published) rather than an arbitrary one.
    const rows = (await this.db.execute(
      sql`select gh_owner, gh_repo
          from projects
          where source = 'github'
            and status = 'published'
            and published_at is not null
            and gh_owner is not null
            and gh_repo is not null
          order by is_featured desc, published_at desc, id`,
    )) as Array<Record<string, unknown>>;
    return rows
      .filter(
        (r) => typeof r.gh_owner === 'string' && typeof r.gh_repo === 'string',
      )
      .map((r) => ({ owner: String(r.gh_owner), repo: String(r.gh_repo) }));
  }

  async findPublishedSlugByGithub(
    owner: string,
    repo: string,
  ): Promise<string | null> {
    const rows = (await this.db.execute(
      sql`select slug
          from projects
          where source = 'github'
            and status = 'published'
            and published_at is not null
            and lower(gh_owner) = lower(${owner})
            and lower(gh_repo) = lower(${repo})
          order by is_featured desc, published_at desc, id
          limit 1`,
    )) as Array<Record<string, unknown>>;
    const slug = rows[0]?.slug;
    return typeof slug === 'string' ? slug : null;
  }
}
