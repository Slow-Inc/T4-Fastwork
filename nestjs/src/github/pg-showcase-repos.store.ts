import { Inject, Injectable } from '@nestjs/common';
import { sql } from 'drizzle-orm';
import { DRIZZLE, type DrizzleDB } from '../database/database.module';
import type { ShowcaseRepoProvider } from './github-refresh.service';
import type { ReadmeSnapshotState } from './missing-readme-backfill';

/** Lookup a published project slug from its GitHub identity (#143). */
export interface ProjectGithubSlugLookup {
  findPublishedSlugByGithub(
    owner: string,
    repo: string,
  ): Promise<string | null>;
}

/** A `checkedAt` that is absent or unparseable yields null, which the TTL treats as expired. */
function parseCheckedAt(value: unknown): Date | null {
  if (typeof value !== 'string') return null;
  const at = new Date(value);
  return Number.isNaN(at.getTime()) ? null : at;
}

/** Ports for #158 missing-README backfill (list + stored snapshot state). */
export interface MissingReadmeStore {
  listPublishedGithubForReadmeBackfill(): Promise<
    { owner: string; repo: string; slug: string }[]
  >;
  /**
   * Every stored readme snapshot with enough state to judge whether it still counts as checked.
   * Returns the state rather than a bare key set (#215): a #177 missing-marker is a readme key
   * too, and treating it as permanently authoritative excluded its repo from this backfill forever.
   */
  listReadmeSnapshotStates(): Promise<ReadmeSnapshotState[]>;
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
  implements ShowcaseRepoProvider, ProjectGithubSlugLookup, MissingReadmeStore
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

  async listPublishedGithubForReadmeBackfill(): Promise<
    { owner: string; repo: string; slug: string }[]
  > {
    const rows = (await this.db.execute(
      sql`select slug, gh_owner, gh_repo
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
        (r) =>
          typeof r.slug === 'string' &&
          typeof r.gh_owner === 'string' &&
          typeof r.gh_repo === 'string',
      )
      .map((r) => ({
        slug: String(r.slug),
        owner: String(r.gh_owner),
        repo: String(r.gh_repo),
      }));
  }

  async listReadmeSnapshotStates(): Promise<ReadmeSnapshotState[]> {
    // `missing` / `checked_at` come from the #177 marker shape; a real README snapshot has neither,
    // so it reads as `missing: false` and the TTL never applies to it.
    const rows = (await this.db.execute(
      sql`select key,
                 (data->>'missing') = 'true' as missing,
                 data->>'checkedAt' as checked_at
          from github_snapshots
          where key like ${'repo:%:readme'}`,
    )) as Array<Record<string, unknown>>;
    const states: ReadmeSnapshotState[] = [];
    for (const r of rows) {
      if (
        typeof r.key !== 'string' ||
        !/^repo:[^/]+\/[^:]+:readme$/i.test(r.key)
      ) {
        continue;
      }
      states.push({
        key: r.key,
        missing: r.missing === true,
        checkedAt: parseCheckedAt(r.checked_at),
      });
    }
    return states;
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
