import { describe, it, expect } from 'bun:test';
import {
  needsTaxonomy,
  taxonomyOnlyPatch,
  TaxonomyGenerateService,
  type TaxonomyProject,
  type TaxonomyStore,
  type TaxonomyReadmeReader,
  type TaxonomyLlm,
} from '../src/github/taxonomy-generate';
import type { CurrentContent } from '../src/github/github-generate';

const base: TaxonomyProject = {
  id: 1,
  slug: 'resume-web',
  ghOwner: 'xenodeve',
  ghRepo: 'resume_web',
  description: 'portfolio',
  categoryId: null,
  categoryOwner: 'auto',
  tagsOwner: 'auto',
  technologiesOwner: 'auto',
  readmeSha: 'already-set',
};

describe('needsTaxonomy', () => {
  it('true when category_id null and category_owner auto', () => {
    expect(needsTaxonomy(base)).toBe(true);
  });
  it('false when category already set or human-owned', () => {
    expect(needsTaxonomy({ ...base, categoryId: 9 })).toBe(false);
    expect(needsTaxonomy({ ...base, categoryOwner: 'human' })).toBe(false);
  });
});

describe('taxonomyOnlyPatch', () => {
  const current: CurrentContent = {
    titleOwner: 'auto',
    titleEnOwner: 'auto',
    descriptionOwner: 'auto',
    contentOwner: 'auto',
    categoryOwner: 'auto',
    tagsOwner: 'auto',
    technologiesOwner: 'human',
  };
  it('keeps only auto-owned taxonomy fields', () => {
    const patch = taxonomyOnlyPatch(current, {
      title: 'ท',
      titleEn: 'T',
      description: 'ด',
      content: 'ค',
      category: 'Web',
      tags: ['Portfolio'],
      technologies: ['Next.js'],
    });
    expect(patch).toEqual({
      category: 'Web',
      tags: ['Portfolio'],
    });
    expect(patch.title).toBeUndefined();
    expect(patch.technologies).toBeUndefined();
  });
});

describe('TaxonomyGenerateService', () => {
  it('skips when README snapshot missing (no LLM)', async () => {
    const applied: unknown[] = [];
    const store: TaxonomyStore = {
      listPublishedNeedingTaxonomy: async () => [base],
      getContent: async () => ({
        titleOwner: 'auto',
        titleEnOwner: 'auto',
        descriptionOwner: 'auto',
        contentOwner: 'auto',
        categoryOwner: 'auto',
        tagsOwner: 'auto',
        technologiesOwner: 'auto',
        readmeSha: 'already-set',
      }),
      applyPatch: async (_s, p) => {
        applied.push(p);
      },
    };
    const readme: TaxonomyReadmeReader = {
      getRepoReadme: async () => null,
    };
    let llmCalls = 0;
    const llm: TaxonomyLlm = {
      complete: async () => {
        llmCalls++;
        return '{}';
      },
    };
    const svc = new TaxonomyGenerateService(readme, llm, store);
    expect(await svc.generateForProject(base)).toEqual({ generated: false });
    expect(llmCalls).toBe(0);
    expect(applied).toHaveLength(0);
  });

  it('applies taxonomy-only patch even when readme_sha already set', async () => {
    const applied: { slug: string; patch: Record<string, unknown> }[] = [];
    const store: TaxonomyStore = {
      listPublishedNeedingTaxonomy: async () => [base],
      getContent: async () => ({
        titleOwner: 'auto',
        titleEnOwner: 'auto',
        descriptionOwner: 'auto',
        contentOwner: 'auto',
        categoryOwner: 'auto',
        tagsOwner: 'auto',
        technologiesOwner: 'auto',
        readmeSha: 'already-set',
      }),
      applyPatch: async (slug, patch) => {
        applied.push({ slug, patch: patch as Record<string, unknown> });
      },
    };
    const readme: TaxonomyReadmeReader = {
      getRepoReadme: async () => ({
        data: { markdown: 'Uses Bun and Next.js', sha: 'newsha' },
        stale: false,
      }),
    };
    const llm: TaxonomyLlm = {
      complete: async () =>
        JSON.stringify({
          title: 'ท',
          titleEn: 'T',
          description: 'ด',
          content: 'ค\n\nข',
          category: 'Web App',
          tags: ['Portfolio'],
          technologies: ['Bun', 'Invented'],
        }),
    };
    const svc = new TaxonomyGenerateService(readme, llm, store);
    const res = await svc.generateForProject(base);
    expect(res.generated).toBe(true);
    expect(applied).toHaveLength(1);
    expect(applied[0].slug).toBe('resume-web');
    expect(applied[0].patch.category).toBe('Web App');
    expect(applied[0].patch.tags).toEqual(['Portfolio']);
    // Invented dropped; Bun evidenced in README
    expect(applied[0].patch.technologies).toEqual(['Bun']);
    expect(applied[0].patch.title).toBeUndefined();
    // preserves prior readme_sha bookkeeping
    expect(applied[0].patch.readmeSha).toBe('already-set');
  });
});
