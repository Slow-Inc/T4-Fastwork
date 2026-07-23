/**
 * Autonomous content generation for the showcase (spec 2026-07-14, P3). For a
 * tracked repo whose README changed, an LLM writes the project's TH/EN copy;
 * the result is guarded (no hallucinated tech), then reconciled against the
 * row's per-field provenance so human edits are never overwritten.
 *
 * The LLM call is injected (`LlmClient`) so the reconciliation + guardrail
 * logic — the parts that matter for correctness — are pure and unit-tested.
 */

/** Structured content the LLM returns (already parsed/validated JSON). */
export interface GeneratedContent {
  title: string;
  titleEn: string;
  description: string;
  content: string;
  category: string;
  tags: string[];
  technologies: string[];
}

/** The subset of a project row the reconciler reads (per-field owners). */
export interface CurrentContent {
  titleOwner: 'auto' | 'human';
  titleEnOwner: 'auto' | 'human';
  descriptionOwner: 'auto' | 'human';
  contentOwner: 'auto' | 'human';
  categoryOwner: 'auto' | 'human';
  tagsOwner: 'auto' | 'human';
  technologiesOwner: 'auto' | 'human';
}

export interface GenerateContext {
  readmeSha: string | null;
  readme: string;
  languages: Record<string, number>;
  description: string | null;
  topics: string[];
}

export type ContentPatch = Partial<
  Pick<
    GeneratedContent,
    | 'title'
    | 'titleEn'
    | 'description'
    | 'content'
    | 'category'
    | 'tags'
    | 'technologies'
  >
> & { readmeSha?: string | null; generatedAt?: Date };

export interface GenerateStore {
  getContent(
    slug: string,
  ): Promise<(CurrentContent & { readmeSha: string | null }) | null>;
  applyPatch(slug: string, patch: ContentPatch): Promise<void>;
}

export type LlmClient = (ctx: GenerateContext) => Promise<GeneratedContent>;

/**
 * Merge generated content into a patch, honoring per-field provenance: only
 * `auto`-owned fields are written; `human`-owned fields are omitted so a human
 * edit is never clobbered.
 */
export function reconcile(
  current: CurrentContent,
  generated: GeneratedContent,
): ContentPatch {
  const patch: ContentPatch = {};
  if (current.titleOwner === 'auto') patch.title = generated.title;
  if (current.titleEnOwner === 'auto') patch.titleEn = generated.titleEn;
  if (current.descriptionOwner === 'auto')
    patch.description = generated.description;
  if (current.contentOwner === 'auto') patch.content = generated.content;
  if (current.categoryOwner === 'auto') patch.category = generated.category;
  if (current.tagsOwner === 'auto') patch.tags = generated.tags;
  if (current.technologiesOwner === 'auto')
    patch.technologies = generated.technologies;
  return patch;
}

/**
 * Keep only auto-owned fields from a reviewed dry-run patch (#75). Defense in
 * depth so apply:true cannot clobber human fields even if the client sends them.
 */
export function filterReviewedPatch(
  current: CurrentContent,
  reviewed: ContentPatch,
): ContentPatch {
  const patch: ContentPatch = {};
  if (current.titleOwner === 'auto' && reviewed.title !== undefined)
    patch.title = reviewed.title;
  if (current.titleEnOwner === 'auto' && reviewed.titleEn !== undefined)
    patch.titleEn = reviewed.titleEn;
  if (current.descriptionOwner === 'auto' && reviewed.description !== undefined)
    patch.description = reviewed.description;
  if (current.contentOwner === 'auto' && reviewed.content !== undefined)
    patch.content = reviewed.content;
  if (current.categoryOwner === 'auto' && reviewed.category !== undefined)
    patch.category = reviewed.category;
  if (current.tagsOwner === 'auto' && reviewed.tags !== undefined)
    patch.tags = reviewed.tags;
  if (
    current.technologiesOwner === 'auto' &&
    reviewed.technologies !== undefined
  )
    patch.technologies = reviewed.technologies;
  if (reviewed.readmeSha !== undefined) patch.readmeSha = reviewed.readmeSha;
  if (reviewed.generatedAt !== undefined)
    patch.generatedAt = reviewed.generatedAt;
  return patch;
}

/**
 * Drop technologies the LLM invented: keep only those evidenced by the repo's
 * language breakdown or mentioned in the README (case-insensitive).
 */
export function validateTechnologies(
  techs: string[],
  languages: Record<string, number>,
  readme: string,
): string[] {
  const langKeys = Object.keys(languages).map((k) => k.toLowerCase());
  const readmeLc = readme.toLowerCase();
  return techs.filter((t) => {
    const lc = t.toLowerCase();
    return langKeys.includes(lc) || readmeLc.includes(lc);
  });
}

export class ContentGenerateService {
  constructor(
    private readonly store: GenerateStore,
    private readonly llm: LlmClient,
    private readonly now: () => Date = () => new Date(),
  ) {}

  /**
   * Generate + reconcile content for one repo. Skips (no LLM call) when the
   * README sha is unchanged since the last generation (delta gate).
   */
  async generateForRepo(
    slug: string,
    ctx: GenerateContext,
  ): Promise<{ generated: boolean }> {
    const current = await this.store.getContent(slug);
    if (!current) return { generated: false };
    if (current.readmeSha && current.readmeSha === ctx.readmeSha) {
      return { generated: false }; // README unchanged → nothing to do
    }

    const raw = await this.llm(ctx);
    const guarded: GeneratedContent = {
      ...raw,
      technologies: validateTechnologies(
        raw.technologies,
        ctx.languages,
        ctx.readme,
      ),
    };

    const patch = reconcile(current, guarded);
    patch.readmeSha = ctx.readmeSha;
    patch.generatedAt = this.now();
    await this.store.applyPatch(slug, patch);
    return { generated: true };
  }
}
