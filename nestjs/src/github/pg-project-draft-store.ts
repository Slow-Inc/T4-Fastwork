import { Inject, Injectable } from '@nestjs/common';
import { sql } from 'drizzle-orm';
import { DRIZZLE, type DrizzleDB } from '../database/database.module';
import type { DraftProject, ProjectDraftStore } from './github-curate';

/**
 * Postgres-backed ProjectDraftStore over the Drizzle pooler (mirrors PgGenerateStore).
 * Backs CurateService: reports whether a slug is already tracked, and inserts a
 * github-sourced DRAFT `projects` row — every content field auto-owned — awaiting the
 * one-time first-run approval. The pooler is the superuser connection (bypasses RLS),
 * so this backend write is not subject to the frontend policies. `on conflict (slug)
 * do nothing` keeps insert idempotent if two curate runs race the same repo.
 */
@Injectable()
export class PgProjectDraftStore implements ProjectDraftStore {
  constructor(@Inject(DRIZZLE) private readonly db: DrizzleDB) {}

  async existsBySlug(slug: string): Promise<boolean> {
    const rows = (await this.db.execute(
      sql`select 1 from projects where slug = ${slug} limit 1`,
    )) as Array<unknown>;
    return rows.length > 0;
  }

  async insertDraft(row: DraftProject): Promise<void> {
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
}
