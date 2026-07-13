import { describe, it, expect } from 'bun:test';
import {
  reconcile,
  validateTechnologies,
  ContentGenerateService,
  type GeneratedContent,
  type CurrentContent,
  type GenerateStore,
  type LlmClient,
} from '../src/github/github-generate.ts';

const generated: GeneratedContent = {
  title: 'MangaDock',
  titleEn: 'MangaDock',
  description: 'AI manga translation platform',
  content: 'Longer blog body.',
  category: 'AI/Automation',
  tags: ['RAG', 'OCR'],
  technologies: ['Next.js', 'Nest.js', 'Rust'],
};

// ---- reconcile (per-field provenance) -------------------------------------

describe('reconcile', () => {
  it('overwrites auto-owned fields and keeps human-owned ones', () => {
    const current: CurrentContent = {
      titleOwner: 'auto',
      titleEnOwner: 'auto',
      descriptionOwner: 'human', // human edited → keep
      contentOwner: 'auto',
      categoryOwner: 'human', // human edited → keep
      tagsOwner: 'auto',
      technologiesOwner: 'auto',
    };

    const patch = reconcile(current, generated);

    expect(patch.title).toBe('MangaDock');
    expect(patch.content).toBe('Longer blog body.');
    expect(patch.tags).toEqual(['RAG', 'OCR']);
    // human-owned fields must NOT appear in the patch
    expect('description' in patch).toBe(false);
    expect('category' in patch).toBe(false);
  });

  it('writes nothing when every field is human-owned', () => {
    const allHuman: CurrentContent = {
      titleOwner: 'human',
      titleEnOwner: 'human',
      descriptionOwner: 'human',
      contentOwner: 'human',
      categoryOwner: 'human',
      tagsOwner: 'human',
      technologiesOwner: 'human',
    };
    expect(reconcile(allHuman, generated)).toEqual({});
  });
});

// ---- validateTechnologies (hallucination guard) ---------------------------

describe('validateTechnologies', () => {
  it('keeps techs evidenced by languages or README, drops the rest', () => {
    const langs = { TypeScript: 1000, CSS: 200 };
    const readme = 'Built with Next.js and Nest.js.';
    // 'Rust' has no evidence (not a language, not in README) → dropped
    const out = validateTechnologies(
      ['Next.js', 'Nest.js', 'Rust', 'TypeScript'],
      langs,
      readme,
    );
    expect(out).toEqual(['Next.js', 'Nest.js', 'TypeScript']);
  });
});

// ---- ContentGenerateService.generateForRepo -------------------------------

describe('ContentGenerateService.generateForRepo', () => {
  function fakeDeps(current: CurrentContent & { readmeSha: string | null }) {
    const saved: { slug: string; patch: Record<string, unknown> }[] = [];
    const store: GenerateStore = {
      getContent: async () => current,
      applyPatch: async (slug, patch) => {
        saved.push({ slug, patch });
      },
    };
    const llm: LlmClient = async () => generated;
    return { store, llm, saved };
  }

  it('skips generation when the README sha is unchanged (delta gate)', async () => {
    const { store, llm, saved } = fakeDeps({
      readmeSha: 'sha-1',
      titleOwner: 'auto',
      titleEnOwner: 'auto',
      descriptionOwner: 'auto',
      contentOwner: 'auto',
      categoryOwner: 'auto',
      tagsOwner: 'auto',
      technologiesOwner: 'auto',
    });
    const svc = new ContentGenerateService(store, llm);

    const r = await svc.generateForRepo('mangadock', {
      readmeSha: 'sha-1', // same as stored → skip
      readme: '# doc',
      languages: { TypeScript: 1 },
      description: 'x',
      topics: [],
    });

    expect(r.generated).toBe(false);
    expect(saved).toHaveLength(0);
  });

  it('generates, validates techs, reconciles, and patches on README change', async () => {
    const { store, llm, saved } = fakeDeps({
      readmeSha: 'old',
      titleOwner: 'auto',
      titleEnOwner: 'auto',
      descriptionOwner: 'human',
      contentOwner: 'auto',
      categoryOwner: 'auto',
      tagsOwner: 'auto',
      technologiesOwner: 'auto',
    });
    const svc = new ContentGenerateService(store, llm);

    const r = await svc.generateForRepo('mangadock', {
      readmeSha: 'new', // changed → generate
      readme: 'Uses Next.js and Nest.js',
      languages: { TypeScript: 1000 },
      description: 'x',
      topics: [],
    });

    expect(r.generated).toBe(true);
    expect(saved).toHaveLength(1);
    const patch = saved[0].patch;
    // human-owned description excluded
    expect('description' in patch).toBe(false);
    // hallucinated 'Rust' dropped by the guard
    expect(patch.technologies).toEqual(['Next.js', 'Nest.js']);
    // readmeSha + generatedAt bookkeeping written
    expect(patch.readmeSha).toBe('new');
  });
});
