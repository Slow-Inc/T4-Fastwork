import { describe, it, expect } from 'bun:test';
import { BadRequestException } from '@nestjs/common';
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

const reviewedPatch: ContentPatch = {
  title: 'T',
  titleEn: 'TE',
  description: 'D',
  content: 'C',
  readmeSha: 'new',
};

function make(
  applyPatch: (s: string, p: ContentPatch) => Promise<void>,
  llm?: LlmClient,
) {
  const store: GenerateStore = {
    getContent: async () => current,
    applyPatch,
  };
  let llmCalls = 0;
  const client: LlmClient = async (c) => {
    llmCalls++;
    return llm ? llm(c) : generated;
  };
  return { c: new GithubGenerateController(store, client), llmCalls: () => llmCalls };
}

describe('GithubGenerateController', () => {
  it('rejects a wrong secret (fail-closed)', async () => {
    process.env.GITHUB_REFRESH_SECRET = 'right';
    const { c } = make(async () => {});
    await expect(
      c.generate('wrong', { slug: 's', context: ctx }),
    ).rejects.toThrow();
  });

  it('dry-run returns the reconciled patch and does NOT persist', async () => {
    process.env.GITHUB_REFRESH_SECRET = 'right';
    let applied = false;
    const { c, llmCalls } = make(async () => {
      applied = true;
    });
    const res = await c.generate('right', { slug: 's', context: ctx });
    expect(res.generated).toBe(true);
    expect(res.applied).toBe(false);
    expect(applied).toBe(false); // the real store.applyPatch is never called
    expect(res.patch?.title).toBe('T'); // auto-owned field generated
    expect(res.patch?.tags).toBeUndefined(); // human-owned field left alone
    expect(llmCalls()).toBe(1);
  });

  it('apply=true persists the reviewed patch WITHOUT a second LLM call (#75)', async () => {
    process.env.GITHUB_REFRESH_SECRET = 'right';
    const patches: ContentPatch[] = [];
    const { c, llmCalls } = make(async (_s, p) => {
      patches.push(p);
    });
    const res = await c.generate('right', {
      slug: 's',
      context: ctx,
      apply: true,
      patch: reviewedPatch,
    });
    expect(res.applied).toBe(true);
    expect(res.generated).toBe(false);
    expect(llmCalls()).toBe(0);
    expect(patches).toHaveLength(1);
    expect(patches[0].title).toBe('T');
    expect(patches[0].category).toBeUndefined(); // human-owned still stripped
  });

  it('apply=true without a patch is rejected', async () => {
    process.env.GITHUB_REFRESH_SECRET = 'right';
    const { c, llmCalls } = make(async () => {});
    await expect(
      c.generate('right', { slug: 's', context: ctx, apply: true }),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(llmCalls()).toBe(0);
  });
});
