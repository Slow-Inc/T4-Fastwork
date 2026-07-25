/**
 * Load ProjectSyncState for one GitHub identity (#187).
 */
import { Inject, Injectable, Logger } from '@nestjs/common';
import { sql } from 'drizzle-orm';
import { DRIZZLE, type DrizzleDB } from '../database/database.module';
import { snapshotKey } from './github.config';
import { isMissingColumnError } from './missing-column';
import type { PipelineStateLoader } from './pipeline-sync';
import type { ProjectSyncState } from './project-automation-sync';

function asOwner(v: unknown): 'auto' | 'human' {
  return v === 'human' ? 'human' : 'auto';
}

@Injectable()
export class PgPipelineSyncStore implements PipelineStateLoader {
  private readonly logger = new Logger(PgPipelineSyncStore.name);

  constructor(@Inject(DRIZZLE) private readonly db: DrizzleDB) {}

  /** Column sets from richest to pre-migration; the first one the DB accepts wins. */
  private static readonly OPTIONAL_COLS = [
    'last_capture_trigger, last_capture_dispatch_at, gh_private',
    'last_capture_trigger, last_capture_dispatch_at',
    'gh_private',
    '',
  ];

  private async selectProjectRow(
    owner: string,
    repo: string,
  ): Promise<Array<Record<string, unknown>>> {
    let lastErr: unknown;
    for (const optional of PgPipelineSyncStore.OPTIONAL_COLS) {
      const extra = optional ? sql`, ${sql.raw(optional)}` : sql``;
      try {
        return (await this.db.execute(
          sql`select id, slug, status, source, gh_owner, gh_repo, live_url, snapshot_image, content,
                     content_owner, category_id, category_owner, tags_owner,
                     technologies_owner, overview_summary, overview_owner,
                     readme_sha${extra}
                from projects
               where source = 'github'
                 and lower(gh_owner) = lower(${owner})
                 and lower(gh_repo) = lower(${repo})
               limit 1`,
        )) as Array<Record<string, unknown>>;
      } catch (err) {
        if (!isMissingColumnError(err)) throw err;
        lastErr = err;
        this.logger.warn(
          `projects select with "${optional}" rejected, trying a poorer column set: ${
            err instanceof Error ? err.message : String(err)
          }`,
        );
      }
    }
    throw lastErr;
  }

  async loadByGithub(
    owner: string,
    repo: string,
  ): Promise<ProjectSyncState | null> {
    // Richer select first, pre-migration shape on an unknown column — the same laddering the
    // frontend does in `nextjs/lib/projects-select.ts`, because the code deploys before
    // migrations 0032/0033 are authorized (#198).
    const rows = await this.selectProjectRow(owner, repo);
    if (!rows.length) return null;
    const r = rows[0];

    const key = snapshotKey.repoReadme(owner, repo);
    const snapRows = (await this.db.execute(
      sql`select data from github_snapshots where key = ${key} limit 1`,
    )) as Array<Record<string, unknown>>;
    let snapshotReadmeSha: string | null = null;
    if (snapRows.length) {
      const data = snapRows[0].data;
      if (data && typeof data === 'object') {
        const sha = (data as Record<string, unknown>).sha;
        if (typeof sha === 'string') snapshotReadmeSha = sha;
      }
    }

    // Prefer last-synced GitHub visibility (#194). Default true only when unknown
    // (curate historically only inserted public repos — ADR 0011).
    const isPublicRepo =
      typeof r.gh_private === 'boolean' ? r.gh_private === false : true;

    return {
      id: Number(r.id),
      slug: String(r.slug),
      status:
        r.status === 'draft' ||
        r.status === 'hidden' ||
        r.status === 'published'
          ? r.status
          : 'published',
      source: r.source === 'cms' ? 'cms' : 'github',
      isPublicRepo,
      ghOwner: String(r.gh_owner ?? owner),
      ghRepo: String(r.gh_repo ?? repo),
      liveUrl: typeof r.live_url === 'string' ? r.live_url : null,
      snapshotImage:
        typeof r.snapshot_image === 'string' ? r.snapshot_image : null,
      readmeSha: typeof r.readme_sha === 'string' ? r.readme_sha : null,
      snapshotReadmeSha,
      content: typeof r.content === 'string' ? r.content : null,
      contentOwner: asOwner(r.content_owner),
      categoryId: r.category_id == null ? null : Number(r.category_id),
      categoryOwner: asOwner(r.category_owner),
      tagsOwner: asOwner(r.tags_owner),
      technologiesOwner: asOwner(r.technologies_owner),
      overviewSummary:
        typeof r.overview_summary === 'string' ? r.overview_summary : null,
      overviewOwner: asOwner(r.overview_owner),
      lastCaptureTrigger:
        typeof r.last_capture_trigger === 'string'
          ? r.last_capture_trigger
          : null,
      lastCaptureDispatchAt:
        r.last_capture_dispatch_at instanceof Date
          ? r.last_capture_dispatch_at.toISOString()
          : typeof r.last_capture_dispatch_at === 'string'
            ? r.last_capture_dispatch_at
            : null,
    };
  }

  async publishGithubDraft(id: number): Promise<boolean> {
    const rows = (await this.db.execute(
      sql`update projects
             set status = 'published',
                 published_at = coalesce(published_at, now()),
                 approved_at = coalesce(approved_at, now())
           where id = ${id}
             and source = 'github'
             and status = 'draft'
       returning id`,
    )) as Array<Record<string, unknown>>;
    return rows.length > 0;
  }

  /**
   * Records that a capture was DISPATCHED — the cooldown input only. `last_capture_trigger` is
   * deliberately not written here: it means "last completed capture" and belongs to the
   * screenshot worker, which runs ~30-60s later and reads this row to decide what to do (#197).
   */
  async recordCaptureDispatch(id: number, atIso: string): Promise<void> {
    await this.db.execute(
      sql`update projects
             set last_capture_dispatch_at = ${atIso}::timestamptz
           where id = ${id}`,
    );
  }
}
