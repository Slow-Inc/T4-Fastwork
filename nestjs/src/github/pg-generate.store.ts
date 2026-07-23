import { Inject, Injectable } from '@nestjs/common';
import { sql } from 'drizzle-orm';
import { DRIZZLE, type DrizzleDB } from '../database/database.module';
import type {
  GenerateStore,
  ContentPatch,
  CurrentContent,
} from './github-generate';
import { sqlTextArray } from './sql-text-array';

/**
 * Postgres-backed GenerateStore over the Drizzle pooler (mirrors PgRankStore).
 * Reads a github-sourced project's per-field provenance + readme sha, and applies
 * a generated patch to the AUTO-owned scalar copy fields.
 *
 * Persists the scalar copy (title/titleEn/description/content) + readme_sha +
 * generated_at, AND the generated taxonomy: category (category_id FK) resolved from
 * the existing `categories`, and tags/technologies replaced in the project_tags /
 * project_technologies M2M (resolved to the existing taxonomy; unknown names dropped).
 * All in one transaction. Every write is guarded by its `*_owner = 'auto'` predicate,
 * so a concurrent human edit is never clobbered. Only rows with source='github' are
 * touched, so curated CMS content is never rewritten by generation.
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
    await this.db.transaction(async (tx) => {
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
      // category → category_id, resolved from the EXISTING taxonomy (name or slug),
      // owner-guarded like the copy fields. An unknown category resolves to NULL.
      if (patch.category !== undefined)
        sets.push(
          sql`category_id = case when category_owner = 'auto'
              then (select id from public.categories
                    where lower(name) = lower(${patch.category}) or slug = ${patch.category}
                    limit 1)
              else category_id end`,
        );
      await tx.execute(
        sql`update projects set ${sql.join(sets, sql`, `)}
            where slug = ${slug} and source = 'github'`,
      );

      // tags / technologies M2M: replace the auto-owned project's links with the
      // generated set, resolved to the EXISTING taxonomy (unknown names are dropped).
      // Owner-guarded in the WHERE, so a human-flagged field is never rewritten; an
      // empty list clears the links (delete only, no insert).
      if (patch.tags !== undefined) {
        await tx.execute(
          sql`delete from project_tags where project_id in (
                select id from projects
                where slug = ${slug} and source = 'github' and tags_owner = 'auto')`,
        );
        if (patch.tags.length)
          await tx.execute(
            sql`insert into project_tags (project_id, tag_id)
                select p.id, t.id from projects p
                join public.tags t
                  on lower(t.name) = any(${sqlTextArray(
                    patch.tags.map((s) => s.toLowerCase()),
                  )})
                where p.slug = ${slug} and p.source = 'github' and p.tags_owner = 'auto'`,
          );
      }
      if (patch.technologies !== undefined) {
        await tx.execute(
          sql`delete from project_technologies where project_id in (
                select id from projects
                where slug = ${slug} and source = 'github' and technologies_owner = 'auto')`,
        );
        if (patch.technologies.length)
          await tx.execute(
            sql`insert into project_technologies (project_id, technology_id)
                select p.id, t.id from projects p
                join public.technologies t
                  on lower(t.name) = any(${sqlTextArray(
                    patch.technologies.map((s) => s.toLowerCase()),
                  )})
                where p.slug = ${slug} and p.source = 'github' and p.technologies_owner = 'auto'`,
          );
      }
    });
  }
}
