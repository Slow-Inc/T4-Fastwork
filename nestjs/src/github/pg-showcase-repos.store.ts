import { Inject, Injectable } from '@nestjs/common';
import { sql } from 'drizzle-orm';
import { DRIZZLE, type DrizzleDB } from '../database/database.module';
import type { ShowcaseRepoProvider } from './github-refresh.service';
import type { ReadmeSnapshotState } from './missing-readme-backfill';
import type { CompletenessRow } from './project-completeness';
import type { ProjectSyncHealth } from './sync-health';
import { isMissingColumnError } from './missing-column';

/** Lookup a published project slug from its GitHub identity (#143). */
export interface ProjectGithubSlugLookup {
  findPublishedSlugByGithub(
    owner: string,
    repo: string,
  ): Promise<string | null>;
}

/** Ports for the #222 completeness report. */
export interface ProjectCompletenessStore {
  listPublishedGithubForCompleteness(): Promise<CompletenessRow[]>;
  listReadmeSnapshotStates(): Promise<ReadmeSnapshotState[]>;
}

function asOwner(v: unknown): 'auto' | 'human' {
  return v === 'human' ? 'human' : 'auto';
}

/**
 * A projected `left(btrim(...), 1)`: `''` means the field is empty, one character means it is not.
 * Mapped back to `null`/that character so the completeness predicate keeps one emptiness rule.
 */
function headOrNull(v: unknown): string | null {
  return typeof v === 'string' && v !== '' ? v : null;
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
  implements
    ShowcaseRepoProvider,
    ProjectGithubSlugLookup,
    MissingReadmeStore,
    ProjectCompletenessStore
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

  /**
   * Every published github row with the fields the completeness invariant reads (#222). The
   * `*_owner` columns are selected on purpose: a blank field a human owns is an editorial decision,
   * and without the owner the report cannot tell that from a generator that never ran.
   */
  async listPublishedGithubForCompleteness(): Promise<CompletenessRow[]> {
    const rows = (await this.db.execute(
      sql`select slug, gh_owner, gh_repo, status, source,
                 category_id, category_owner,
                 left(btrim(coalesce(content, '')), 1) as content_head,
                 content_owner,
                 left(btrim(coalesce(overview_summary, '')), 1) as overview_head,
                 overview_owner
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
        ghOwner: String(r.gh_owner),
        ghRepo: String(r.gh_repo),
        // The query already constrains both, so this is a narrowing for the type, not a fallback.
        status: 'published' as const,
        source: 'github' as const,
        categoryId: r.category_id == null ? null : Number(r.category_id),
        categoryOwner: asOwner(r.category_owner),
        // Only emptiness matters here, so the query returns the first character of the trimmed
        // value and this maps "" back to null. Selecting `content` itself would drag every
        // project's full case-study markdown across the pooler on every hourly run — the same
        // reason `listReadmeSnapshotStates` projects instead of selecting `data`. `btrim` in SQL
        // keeps the rule identical to the planner's `content.trim() === ''`.
        content: headOrNull(r.content_head),
        contentOwner: asOwner(r.content_owner),
        overviewSummary: headOrNull(r.overview_head),
        overviewOwner: asOwner(r.overview_owner),
      }));
  }

  /**
   * The sync-health rows `isSyncUnhealthy` reads (#193), or **null when the columns do not exist**.
   *
   * That distinction is the whole point: `0034` is parked behind the production-write gate, so this
   * ships before its columns. Reading a missing column as "no data" would report all 47 projects as
   * `never` on every run — the loudest possible alert at the moment it knows the least. A caller must
   * treat null as *not assessable*. Any other failure rethrows, because swallowing a pooler outage
   * would produce an empty unhealthy list, which reads as an all-clear.
   */
  async listProjectSyncHealth(): Promise<ProjectSyncHealth[] | null> {
    let rows: Array<Record<string, unknown>>;
    try {
      rows = (await this.db.execute(
        sql`select slug, last_synced_at, last_sync_error
            from projects
            where source = 'github'
              and status = 'published'
              and published_at is not null
            order by is_featured desc, published_at desc, id`,
      )) as Array<Record<string, unknown>>;
    } catch (err) {
      if (isMissingColumnError(err)) return null;
      throw err;
    }
    return rows
      .filter((r) => typeof r.slug === 'string')
      .map((r) => ({
        slug: String(r.slug),
        lastSyncedAt:
          r.last_synced_at instanceof Date
            ? r.last_synced_at
            : typeof r.last_synced_at === 'string'
              ? new Date(r.last_synced_at)
              : null,
        lastSyncError:
          typeof r.last_sync_error === 'string' ? r.last_sync_error : null,
      }));
  }

  async listReadmeSnapshotStates(): Promise<ReadmeSnapshotState[]> {
    // Both fields come from the #177 marker shape; a real README snapshot has neither, so it reads
    // as `missing: false` and the TTL never applies to it. Projected rather than selecting `data`,
    // because that would pull every README's full markdown on every backfill run.
    //
    // `->>` yields text or null, and the comparison happens in TS on purpose: asking Postgres for a
    // boolean would make this depend on how the driver maps one, and a driver that returned `'t'`
    // would read the marker as a real snapshot — silently restoring the permanent exclusion #215
    // removes. Text has one representation.
    const rows = (await this.db.execute(
      sql`select key,
                 data->>'missing' as missing_flag,
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
        missing: r.missing_flag === 'true',
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
