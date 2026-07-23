import { Inject, Injectable } from '@nestjs/common';
import { sql } from 'drizzle-orm';
import { DRIZZLE, type DrizzleDB } from '../database/database.module';
import type { GeneratedContent } from './github-generate';
import type {
  CaseStudyProject,
  CaseStudySimpleStore,
} from './case-study-simple';

/**
 * Postgres-backed store for the simplified case study (ADR 0013) over the Drizzle
 * pooler. Mirrors PgCaseStudyStore's upsert + PgGenerateStore's owner='auto' guard,
 * but writes ONE published `audience='business'` case_study row per project — no
 * `project_documents`, no 3 audiences, no `generation_jobs`. The superuser pooler
 * bypasses RLS, so these backend writes are unaffected by the anon policies.
 *
 * Only the Thai scalar fields (title/excerpt/content/tags) are persisted — the same
 * EN-column deferral as PgGenerateStore's M2M: `blog_posts` has no title_en/content_en
 * yet (migration 0028, parked), so `gen.titleEn` is intentionally not written here.
 */
@Injectable()
export class PgCaseStudySimpleStore implements CaseStudySimpleStore {
  constructor(@Inject(DRIZZLE) private readonly db: DrizzleDB) {}

  async listPublishedGithubProjects(): Promise<CaseStudyProject[]> {
    // Same predicate as the public /projects read (projects-repo.getAllProjects):
    // published AND published_at set. Ordered so a bounded run has a deterministic,
    // priority set (featured first, then most recently published).
    const rows = (await this.db.execute(
      sql`select id, slug, gh_owner, gh_repo, readme_sha, description
          from projects
          where source = 'github'
            and status = 'published'
            and published_at is not null
            and gh_owner is not null
            and gh_repo is not null
          order by is_featured desc, published_at desc, id`,
    )) as Array<Record<string, unknown>>;
    return rows.map((r) => ({
      id: Number(r.id),
      slug: String(r.slug),
      ghOwner: r.gh_owner == null ? null : String(r.gh_owner),
      ghRepo: r.gh_repo == null ? null : String(r.gh_repo),
      readmeSha: typeof r.readme_sha === 'string' ? r.readme_sha : null,
      description: typeof r.description === 'string' ? r.description : null,
    }));
  }

  async publishCaseStudy(
    projectId: number,
    slug: string,
    gen: GeneratedContent,
    sha: string,
  ): Promise<void> {
    const postSlug = `${slug}-case-study`;
    // drizzle's `sql` template EXPANDS a bare `${jsArray}` into separate
    // placeholders (`($1,$2,$3)`), which lands a row/tuple in the `tags` column
    // position and breaks the INSERT. Build an explicit ARRAY[...] constructor so
    // it's one text[] value, with every element still parameterized (injection-safe).
    const tags = sql`array[${sql.join(
      gen.tags.map((t) => sql`${t}`),
      sql`, `,
    )}]::text[]`;
    await this.db.transaction(async (tx) => {
      // a) Upsert the published business case-study post. audience='business' is
      //    part of the (project_id, audience) idempotency key; owner='auto' guard in
      //    the conflict update means a human takeover of the post is never clobbered.
      //    Auto-publish (published_at = now()) per ADR 0011 — the repo is public and
      //    the copy passed the injection-fence/tech guard.
      await tx.execute(
        sql`insert into blog_posts
              (slug, title, excerpt, content, tags, project_id, audience, kind, source, owner, published_at)
            values
              (${postSlug}, ${gen.title}, ${gen.description}, ${gen.content}, ${tags}, ${projectId},
               'business', 'case_study', 'github', 'auto', now())
            on conflict (project_id, audience) where kind = 'case_study'
            do update set
              title = case when blog_posts.owner = 'auto' then excluded.title else blog_posts.title end,
              excerpt = case when blog_posts.owner = 'auto' then excluded.excerpt else blog_posts.excerpt end,
              content = case when blog_posts.owner = 'auto' then excluded.content else blog_posts.content end,
              tags = case when blog_posts.owner = 'auto' then excluded.tags else blog_posts.tags end,
              published_at = case when blog_posts.owner = 'auto'
                                  then coalesce(blog_posts.published_at, now())
                                  else blog_posts.published_at end`,
      );
      // b) Mirror the narrative into projects.content (owner-guarded) so the existing
      //    chunkProject/RAG ingest picks it up — no chunkBlog needed. readme_sha is
      //    bumped INSIDE the same txn, AFTER the blog write, so a mid-write failure
      //    leaves the old sha and the project is retried on the next run.
      await tx.execute(
        sql`update projects
            set content = case when content_owner = 'auto' then ${gen.content} else content end,
                readme_sha = ${sha},
                generated_at = now()
            where id = ${projectId} and source = 'github'`,
      );
    });
  }
}
