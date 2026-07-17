import { Inject, Injectable } from '@nestjs/common';
import { sql } from 'drizzle-orm';
import { DRIZZLE, type DrizzleDB } from '../database/database.module';
import type {
  GenerateStore,
  ContentPatch,
  CurrentContent,
} from './github-generate';

/**
 * Postgres-backed GenerateStore over the Drizzle pooler (mirrors PgRankStore).
 * Reads a github-sourced project's per-field provenance + readme sha, and applies
 * a generated patch to the AUTO-owned scalar copy fields.
 *
 * MVP scope: persists the scalar copy (title/titleEn/description/content) +
 * readme_sha + generated_at. category (category_id FK) and tags/technologies
 * (project_tags / project_technologies M2M) are a documented follow-up — the copy
 * is the primary generated value. Only rows with source='github' are ever touched,
 * so curated CMS content is never rewritten by generation.
 */
@Injectable()
export class PgGenerateStore implements GenerateStore {
  constructor(@Inject(DRIZZLE) private readonly db: DrizzleDB) {}

  async getContent(
    slug: string,
  ): Promise<(CurrentContent & { readmeSha: string | null }) | null> {
    const rows = (await this.db.execute(
      sql`select title_owner, title_en_owner, description_owner, content_owner,
                 category_owner, tags_owner, technologies_owner, readme_sha
          from projects
          where slug = ${slug} and source = 'github'
          limit 1`,
    )) as Array<Record<string, unknown>>;
    const r = rows[0];
    if (!r) return null;
    const owner = (v: unknown): 'auto' | 'human' =>
      v === 'auto' ? 'auto' : 'human';
    return {
      titleOwner: owner(r.title_owner),
      titleEnOwner: owner(r.title_en_owner),
      descriptionOwner: owner(r.description_owner),
      contentOwner: owner(r.content_owner),
      categoryOwner: owner(r.category_owner),
      tagsOwner: owner(r.tags_owner),
      technologiesOwner: owner(r.technologies_owner),
      readmeSha: typeof r.readme_sha === 'string' ? r.readme_sha : null,
    };
  }

  async applyPatch(slug: string, patch: ContentPatch): Promise<void> {
    // readme_sha + generated_at are generation bookkeeping (not human-ownable) —
    // always recorded so the delta-gate/cache knows this readme was processed.
    const sets = [
      sql`readme_sha = ${patch.readmeSha ?? null}`,
      sql`generated_at = ${(patch.generatedAt ?? new Date()).toISOString()}`,
    ];
    // #75: guard each copy field with its *_owner = 'auto' predicate, atomically
    // in the UPDATE. A human edit that flipped the owner to 'human' during
    // generation must survive — the CASE preserves the existing value rather than
    // clobbering it with the now-stale generated patch (no read-then-write race).
    if (patch.title !== undefined)
      sets.push(
        sql`title = case when title_owner = 'auto' then ${patch.title} else title end`,
      );
    if (patch.titleEn !== undefined)
      sets.push(
        sql`title_en = case when title_en_owner = 'auto' then ${patch.titleEn} else title_en end`,
      );
    if (patch.description !== undefined)
      sets.push(
        sql`description = case when description_owner = 'auto' then ${patch.description} else description end`,
      );
    if (patch.content !== undefined)
      sets.push(
        sql`content = case when content_owner = 'auto' then ${patch.content} else content end`,
      );
    await this.db.execute(
      sql`update projects set ${sql.join(sets, sql`, `)}
          where slug = ${slug} and source = 'github'`,
    );
  }
}
