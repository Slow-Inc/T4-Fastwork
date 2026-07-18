import { Inject, Injectable } from '@nestjs/common';
import { sql } from 'drizzle-orm';
import { DRIZZLE, type DrizzleDB } from '../database/database.module';
import type {
  ProjectDocument,
  FileExtract,
  CaseStudy,
} from './github-case-study';
import type { CaseStudyStore } from './github-case-study-persist';

/** A stored jsonb `extract` is only reused if it is a well-formed FileExtract —
 * a partial/corrupt cached blob is dropped so the file is re-mapped instead. */
function isFileExtract(e: unknown): e is FileExtract {
  if (e == null || typeof e !== 'object') return false;
  const o = e as Record<string, unknown>;
  return (
    typeof o.path === 'string' &&
    typeof o.blobSha === 'string' &&
    Array.isArray(o.themes) &&
    typeof o.architecture === 'string' &&
    Array.isArray(o.tech) &&
    typeof o.userOutcomes === 'string' &&
    typeof o.codeDepth === 'string'
  );
}

/**
 * Postgres-backed CaseStudyStore over the Drizzle pooler (mirrors PgGenerateStore
 * / PgRankStore). Raw SQL over the P1 tables (`project_documents`, `blog_posts`,
 * `generation_jobs`, migration 0020) + the extract cache column (migration 0022).
 * The superuser pooler bypasses RLS, so these backend writes are unaffected by the
 * anon policies.
 *
 * MVP scope (ADR 0009 Q4): case-study copy is written to the scalar `blog_posts`
 * fields (title/excerpt/content/tags) as a draft (`published_at` null — no
 * auto-publish before the P5 safety gate #68). `titleEn` + `technologies` have no
 * `blog_posts` column yet (a documented follow-up, same as PgGenerateStore's M2M
 * deferral). Only `owner='auto'` rows are rewritten, so a human takeover sticks.
 */
@Injectable()
export class PgCaseStudyStore implements CaseStudyStore {
  constructor(@Inject(DRIZZLE) private readonly db: DrizzleDB) {}

  async readManifest(
    projectId: number,
  ): Promise<{ docs: ProjectDocument[]; cachedExtracts: FileExtract[] }> {
    const rows = (await this.db.execute(
      sql`select path, blob_sha, markdown, extract
          from project_documents
          where project_id = ${projectId} and deleted_at is null`,
    )) as Array<Record<string, unknown>>;
    const docs = rows.map((r) => ({
      path: String(r.path),
      blobSha: String(r.blob_sha),
      markdown: typeof r.markdown === 'string' ? r.markdown : '',
    }));
    // The cached extract carries the blob_sha it was mapped from, so a file whose
    // manifest row sha changed is still re-mapped (its stored extract.blobSha no
    // longer matches the row) — the freshness check lives in selectDocsToMap. A
    // malformed cached blob is dropped (treated as uncached → re-mapped), never
    // fed downstream as a valid extract.
    const cachedExtracts = rows.map((r) => r.extract).filter(isFileExtract);
    return { docs, cachedExtracts };
  }

  async saveExtracts(
    projectId: number,
    extracts: FileExtract[],
  ): Promise<void> {
    // One transaction so a mid-loop failure never leaves the extract cache
    // half-written (mirrors PgRankStore.applyRanks).
    await this.db.transaction(async (tx) => {
      for (const e of extracts) {
        await tx.execute(
          sql`update project_documents
              set extract = ${JSON.stringify(e)}::jsonb, updated_at = now()
              where project_id = ${projectId} and path = ${e.path}`,
        );
      }
    });
  }

  async upsertCaseStudies(
    projectId: number,
    projectSlug: string,
    studies: CaseStudy[],
  ): Promise<void> {
    // One transaction so a mid-loop failure never leaves a partially-rewritten
    // post set — a throw rolls back all audiences, keeping the last published
    // case studies intact (mirrors PgRankStore.applyRanks).
    await this.db.transaction(async (tx) => {
      for (const s of studies) {
        const slug = `${projectSlug}-${s.audience}`;
        await tx.execute(
          sql`insert into blog_posts
              (slug, title, excerpt, content, tags, project_id, audience, kind, source, owner, published_at)
            values
              (${slug}, ${s.title}, ${s.description}, ${s.content}, ${s.tags}, ${projectId}, ${s.audience}, 'case_study', 'github', 'auto', null)
            on conflict (project_id, audience) where kind = 'case_study'
            do update set
              title = case when blog_posts.owner = 'auto' then excluded.title else blog_posts.title end,
              excerpt = case when blog_posts.owner = 'auto' then excluded.excerpt else blog_posts.excerpt end,
              content = case when blog_posts.owner = 'auto' then excluded.content else blog_posts.content end,
              tags = case when blog_posts.owner = 'auto' then excluded.tags else blog_posts.tags end`,
        );
      }
    });
  }

  async isJobDone(
    projectId: number,
    manifestHash: string,
    promptVersion: string,
  ): Promise<boolean> {
    const rows = (await this.db.execute(
      sql`select 1 from generation_jobs
          where project_id = ${projectId}
            and input_manifest_hash = ${manifestHash}
            and prompt_version = ${promptVersion}
            and status = 'done'
          limit 1`,
    )) as unknown[];
    return rows.length > 0;
  }

  async recordJob(
    projectId: number,
    manifestHash: string,
    promptVersion: string,
    status: 'done' | 'failed',
    error?: string,
  ): Promise<void> {
    await this.db.execute(
      sql`insert into generation_jobs
            (project_id, input_manifest_hash, prompt_version, status, attempts, error, updated_at)
          values
            (${projectId}, ${manifestHash}, ${promptVersion}, ${status}, 1, ${error ?? null}, now())
          on conflict (project_id, input_manifest_hash, prompt_version)
          do update set
            status = excluded.status,
            attempts = generation_jobs.attempts + 1,
            error = excluded.error,
            updated_at = now()`,
    );
  }
}
