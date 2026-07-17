/**
 * P2 persistence for the map-reduce case studies (#81 · ADR 0009 D1–D3). Ties the
 * pure `runMapReduce` (github-case-study.ts) to the DB: read a project's Markdown
 * manifest + cached extracts, skip when the manifest+prompt is unchanged
 * (idempotency), else generate and persist the three audience case studies + the
 * refreshed extract cache + a job-ledger row.
 *
 * The store is an interface (implemented by PgCaseStudyStore) so the orchestration
 * is unit-tested with a fake store + spy LLM deps — no DB, no network.
 */
import { Inject, Injectable } from '@nestjs/common';
import {
  curateDocuments,
  computeManifestHash,
  runMapReduce,
  PROMPT_VERSION,
  type ProjectDocument,
  type FileExtract,
  type CaseStudy,
  type ReduceMeta,
} from './github-case-study';
import {
  createCaseStudyLlmClient,
  type LlmComplete,
} from './github-case-study-client';

/** The DB operations the persistence orchestration needs (ADR 0009 D1). */
export interface CaseStudyStore {
  /** The current Markdown manifest (non-deleted rows) + any extracts cached from
   * a prior run, for a project. */
  readManifest(
    projectId: number,
  ): Promise<{ docs: ProjectDocument[]; cachedExtracts: FileExtract[] }>;
  /** Persist map extracts onto their `project_documents` rows (the blob_sha
   * cache) so an unchanged file is not re-mapped next run. */
  saveExtracts(projectId: number, extracts: FileExtract[]): Promise<void>;
  /** Upsert the audience case studies as `blog_posts` (kind='case_study',
   * source='github'); only rewrites a row still owned by 'auto'. */
  upsertCaseStudies(
    projectId: number,
    projectSlug: string,
    studies: CaseStudy[],
  ): Promise<void>;
  /** Has this exact (project, manifest hash, prompt version) already succeeded?
   * (ADR 0009 D3 idempotency — a true here means skip the LLM entirely.) */
  isJobDone(
    projectId: number,
    manifestHash: string,
    promptVersion: string,
  ): Promise<boolean>;
  /** Record a job outcome, upserting on the (project, hash, version) unique key. */
  recordJob(
    projectId: number,
    manifestHash: string,
    promptVersion: string,
    status: 'done' | 'failed',
    error?: string,
  ): Promise<void>;
}

/** Outcome of a persistence run (returned by the orchestration service). */
export interface GenerateResult {
  /** false when skipped (manifest unchanged) — no LLM calls, nothing written. */
  generated: boolean;
  reason?: 'unchanged' | 'no-substance';
  /** number of audience case studies written (0 or 3). */
  written: number;
  mapped: number;
  reused: number;
}

/** DI tokens (mirror RankModule): the store impl + the LLM `complete` binding. */
export const CASE_STUDY_STORE = Symbol('CASE_STUDY_STORE');
export const CASE_STUDY_LLM = Symbol('CASE_STUDY_LLM');

/**
 * Orchestrates one project's case-study generation (ADR 0009 D2/D3). Idempotent:
 * curate → hash the manifest → if that (manifest, prompt_version) already
 * succeeded, return without a single LLM call; else run the map-reduce (reusing
 * cached extracts for unchanged files), persist the refreshed extract cache + the
 * three audience case studies, and record the job. On failure the job is marked
 * `failed` (the last published posts are untouched) and the error rethrown.
 *
 * `meta` (repo description/languages/topics/live_url) is supplied by the caller
 * (the P3 worker / operator endpoint) — this service owns generation+persistence,
 * not repo fetching.
 */
@Injectable()
export class CaseStudyGenerateService {
  constructor(
    @Inject(CASE_STUDY_STORE) private readonly store: CaseStudyStore,
    @Inject(CASE_STUDY_LLM) private readonly complete: LlmComplete,
  ) {}

  async generate(
    projectId: number,
    projectSlug: string,
    meta: ReduceMeta,
  ): Promise<GenerateResult> {
    const { docs, cachedExtracts } = await this.store.readManifest(projectId);
    const manifestHash = computeManifestHash(
      curateDocuments(docs),
      PROMPT_VERSION,
    );

    if (await this.store.isJobDone(projectId, manifestHash, PROMPT_VERSION)) {
      return {
        generated: false,
        reason: 'unchanged',
        written: 0,
        mapped: 0,
        reused: 0,
      };
    }

    try {
      const deps = {
        ...createCaseStudyLlmClient(this.complete),
        cachedExtracts,
      };
      const result = await runMapReduce(docs, meta, deps);
      await this.store.saveExtracts(projectId, result.extracts);

      if (result.caseStudies.length === 0) {
        await this.store.recordJob(
          projectId,
          manifestHash,
          PROMPT_VERSION,
          'done',
        );
        return {
          generated: false,
          reason: 'no-substance',
          written: 0,
          mapped: result.mapped,
          reused: result.reused,
        };
      }

      await this.store.upsertCaseStudies(
        projectId,
        projectSlug,
        result.caseStudies,
      );
      await this.store.recordJob(
        projectId,
        manifestHash,
        PROMPT_VERSION,
        'done',
      );
      return {
        generated: true,
        written: result.caseStudies.length,
        mapped: result.mapped,
        reused: result.reused,
      };
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      await this.store
        .recordJob(projectId, manifestHash, PROMPT_VERSION, 'failed', message)
        .catch(() => {});
      throw err;
    }
  }
}
