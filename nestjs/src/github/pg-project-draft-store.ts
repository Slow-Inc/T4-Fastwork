import { Inject, Injectable, Logger } from '@nestjs/common';
import { sql } from 'drizzle-orm';
import { DRIZZLE, type DrizzleDB } from '../database/database.module';
import type { DraftProject, ProjectDraftStore } from './github-curate';
import { isMissingColumnError } from './missing-column';
import { sqlTextArray } from './sql-text-array';

/**
 * Postgres-backed ProjectDraftStore over the Drizzle pooler (mirrors PgGenerateStore).
 * Backs CurateService: reports whether a slug is already tracked, and inserts a
 * github-sourced DRAFT `projects` row — every content field auto-owned — awaiting the
 * one-time first-run approval. The pooler is the superuser connection (bypasses RLS),
 * so this backend write is not subject to the frontend policies. `on conflict (slug)
 * do nothing` keeps insert idempotent if two curate runs race the same repo.
 *
 * Both writes tolerate a missing `gh_private` column, because the code deploys before
 * migration 0033 is authorized (#198).
 */
@Injectable()
export class PgProjectDraftStore implements ProjectDraftStore {
  private readonly logger = new Logger(PgProjectDraftStore.name);

  constructor(@Inject(DRIZZLE) private readonly db: DrizzleDB) {}

  async existsBySlug(slug: string): Promise<boolean> {
    const rows = (await this.db.execute(
      sql`select 1 from projects where slug = ${slug} limit 1`,
    )) as Array<unknown>;
    return rows.length > 0;
  }

  async insertDraft(row: DraftProject): Promise<void> {
    try {
      await this.db.execute(
        sql`insert into projects
              (slug, title, source, status,
               gh_owner, gh_repo, gh_html_url, gh_private, live_url,
               owner_type, owner_login,
               title_owner, title_en_owner, description_owner, content_owner,
               category_owner, tags_owner, technologies_owner)
            values
              (${row.slug}, ${row.title}, ${row.source}, ${row.status},
               ${row.ghOwner}, ${row.ghRepo}, ${row.ghHtmlUrl}, ${row.ghPrivate}, ${row.liveUrl},
               ${row.ownerType}, ${row.ownerLogin},
               ${row.titleOwner}, ${row.titleEnOwner}, ${row.descriptionOwner}, ${row.contentOwner},
               ${row.categoryOwner}, ${row.tagsOwner}, ${row.technologiesOwner})
            on conflict (slug) do nothing`,
      );
      return;
    } catch (err) {
      if (!isMissingColumnError(err)) throw err;
      this.logger.warn(
        `projects.gh_private missing — inserting ${row.slug} without visibility (migration 0033 not applied)`,
      );
    }

    await this.db.execute(
      sql`insert into projects
            (slug, title, source, status,
             gh_owner, gh_repo, gh_html_url, live_url,
             owner_type, owner_login,
             title_owner, title_en_owner, description_owner, content_owner,
             category_owner, tags_owner, technologies_owner)
          values
            (${row.slug}, ${row.title}, ${row.source}, ${row.status},
             ${row.ghOwner}, ${row.ghRepo}, ${row.ghHtmlUrl}, ${row.liveUrl},
             ${row.ownerType}, ${row.ownerLogin},
             ${row.titleOwner}, ${row.titleEnOwner}, ${row.descriptionOwner}, ${row.contentOwner},
             ${row.categoryOwner}, ${row.tagsOwner}, ${row.technologiesOwner})
          on conflict (slug) do nothing`,
    );
  }

  /**
   * One statement per visibility value for the whole pass, not one per repo (#198). The
   * `where` clause already restricts it to existing github-linked rows.
   */
  async syncGhPrivateBatch(
    entries: Array<{ owner: string; repo: string; ghPrivate: boolean }>,
  ): Promise<void> {
    if (!entries.length) return;

    for (const ghPrivate of [true, false]) {
      const keys = entries
        .filter((e) => e.ghPrivate === ghPrivate)
        .map((e) => `${e.owner.toLowerCase()}/${e.repo.toLowerCase()}`);
      if (!keys.length) continue;

      try {
        await this.db.execute(
          sql`update projects
                 set gh_private = ${ghPrivate}
               where source = 'github'
                 and lower(gh_owner) || '/' || lower(gh_repo) = any(${sqlTextArray(keys)})`,
        );
      } catch (err) {
        if (!isMissingColumnError(err)) throw err;
        this.logger.warn(
          'projects.gh_private missing — skipping visibility sync (migration 0033 not applied)',
        );
        return;
      }
    }
  }
}
