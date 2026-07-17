import { describe, it, expect } from 'bun:test';
import { GithubGenerateController } from '../src/github/github-generate.controller';
import type {
  GenerateStore,
  LlmClient,
  GenerateContext,
  CurrentContent,
  ContentPatch,
} from '../src/github/github-generate';

const ctx: GenerateContext = {
  readmeSha: 'new',
  readme: 'built with TypeScript',
  languages: { TypeScript: 1 },
  description: 'd',
  topics: [],
};

const current: CurrentContent & { readmeSha: string | null } = {
  titleOwner: 'auto',
  titleEnOwner: 'auto',
  descriptionOwner: 'auto',
  contentOwner: 'auto',
  categoryOwner: 'human',
  tagsOwner: 'human',
  technologiesOwner: 'human',
  readmeSha: 'old',
};

const generated = {
  title: 'T',
  titleEn: 'TE',
  description: 'D',
  content: 'C',
  category: 'X',
  tags: ['a'],
  technologies: ['TypeScript'],
};

function make(applyPatch: (s: string, p: ContentPatch) => Promise<void>) {
  const store: GenerateStore = {
    getContent: async () => current,
    applyPatch,
  };
  const client: LlmClient = async () => generated;
  return new GithubGenerateController(store, client);
}

describe('GithubGenerateController', () => {
  it('rejects a wrong secret (fail-closed)', async () => {
    process.env.GITHUB_REFRESH_SECRET = 'right';
    const c = make(async () => {});
    await expect(
      c.generate('wrong', { slug: 's', context: ctx }),
    ).rejects.toThrow();
  });

  it('dry-run returns the reconciled patch and does NOT persist', async () => {
    process.env.GITHUB_REFRESH_SECRET = 'right';
    let applied = false;
    const c = make(async () => {
      applied = true;
    });
    const res = await c.generate('right', { slug: 's', context: ctx });
    expect(res.generated).toBe(true);
    expect(res.applied).toBe(false);
    expect(applied).toBe(false); // the real store.applyPatch is never called
    expect(res.patch?.title).toBe('T'); // auto-owned field generated
    expect(res.patch?.tags).toBeUndefined(); // human-owned field left alone
  });

  it('apply=true persists via the store', async () => {
    process.env.GITHUB_REFRESH_SECRET = 'right';
    let applied = false;
    const c = make(async () => {
      applied = true;
    });
    const res = await c.generate('right', {
      slug: 's',
      context: ctx,
      apply: true,
    });
    expect(res.applied).toBe(true);
    expect(applied).toBe(true);
  });
});
