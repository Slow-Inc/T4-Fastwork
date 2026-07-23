/**
 * Capped AI taxonomy backfill for published GitHub projects missing category
 * (#159 / epic #156). Reuses generate LLM + create-or-select applyPatch.
 * Does NOT use the README sha delta-gate — many rows already have sha from
 * case-study/overview but still lack category_id.
 */
import {
  reconcile,
  validateTechnologies,
  type ContentPatch,
  type CurrentContent,
  type GeneratedContent,
  type GenerateContext,
} from './github-generate';
import {
  buildGeneratePrompt,
  parseGeneratedContent,
} from './github-generate-client';
import type { ChatMessage } from '../llm/llm.service';
import type { ReadmeSnapshot } from './github-detail.service';

export interface TaxonomyProject {
  id: number;
  slug: string;
  ghOwner: string | null;
  ghRepo: string | null;
  description: string | null;
  categoryId: number | null;
  categoryOwner: 'auto' | 'human';
  tagsOwner: 'auto' | 'human';
  technologiesOwner: 'auto' | 'human';
  readmeSha: string | null;
}

export interface TaxonomyStore {
  listPublishedNeedingTaxonomy(): Promise<TaxonomyProject[]>;
  getContent(
    slug: string,
  ): Promise<(CurrentContent & { readmeSha: string | null }) | null>;
  applyPatch(slug: string, patch: ContentPatch): Promise<void>;
}

export interface TaxonomyReadmeReader {
  getRepoReadme(
    owner: string,
    repo: string,
  ): Promise<{ data: unknown; stale: boolean } | null>;
}

export interface TaxonomyLlm {
  complete(messages: ChatMessage[]): Promise<string>;
}

/** Eligible when category is empty and still auto-owned (prod gap ~46 rows). */
export function needsTaxonomy(p: TaxonomyProject): boolean {
  return p.categoryOwner === 'auto' && p.categoryId == null;
}

/** Keep only taxonomy fields from a full generate reconcile. */
export function taxonomyOnlyPatch(
  current: CurrentContent,
  generated: GeneratedContent,
): ContentPatch {
  const full = reconcile(current, generated);
  const patch: ContentPatch = {};
  if (full.category !== undefined) patch.category = full.category;
  if (full.tags !== undefined) patch.tags = full.tags;
  if (full.technologies !== undefined) patch.technologies = full.technologies;
  return patch;
}

function asReadmeSnapshot(data: unknown): ReadmeSnapshot | null {
  if (data == null || typeof data !== 'object') return null;
  const o = data as Record<string, unknown>;
  if (typeof o.markdown !== 'string' || typeof o.sha !== 'string') return null;
  return { markdown: o.markdown, sha: o.sha };
}

export class TaxonomyGenerateService {
  constructor(
    private readonly readme: TaxonomyReadmeReader,
    private readonly llm: TaxonomyLlm,
    private readonly store: TaxonomyStore,
  ) {}

  async generateForProject(
    project: TaxonomyProject,
  ): Promise<{ generated: boolean; patch?: ContentPatch }> {
    if (!needsTaxonomy(project)) return { generated: false };
    if (!project.ghOwner || !project.ghRepo) return { generated: false };

    const current = await this.store.getContent(project.slug);
    if (!current) return { generated: false };

    const rr = await this.readme.getRepoReadme(project.ghOwner, project.ghRepo);
    const snap = asReadmeSnapshot(rr?.data);
    if (!snap) return { generated: false };

    const ctx: GenerateContext = {
      readmeSha: snap.sha,
      readme: snap.markdown,
      languages: {},
      description: project.description,
      topics: [],
    };
    const gen = parseGeneratedContent(
      await this.llm.complete(buildGeneratePrompt(ctx)),
    );
    const guarded: GeneratedContent = {
      ...gen,
      technologies: validateTechnologies(
        gen.technologies,
        ctx.languages,
        ctx.readme,
      ),
    };
    const patch = taxonomyOnlyPatch(current, guarded);
    // Preserve existing readme_sha bookkeeping; do not clear it.
    patch.readmeSha = current.readmeSha ?? snap.sha;
    patch.generatedAt = new Date();

    if (
      patch.category === undefined &&
      patch.tags === undefined &&
      patch.technologies === undefined
    ) {
      return { generated: false };
    }

    await this.store.applyPatch(project.slug, patch);
    return { generated: true, patch };
  }
}
