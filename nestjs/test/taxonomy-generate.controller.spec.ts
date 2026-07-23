import { describe, it, expect, beforeEach, afterEach } from 'bun:test';
import { UnauthorizedException } from '@nestjs/common';
import { TaxonomyGenerateController } from '../src/github/taxonomy-generate.controller';
import type {
  TaxonomyLlm,
  TaxonomyReadmeReader,
  TaxonomyStore,
} from '../src/github/taxonomy-generate';

function make() {
  const applied: string[] = [];
  const store: TaxonomyStore = {
    listPublishedNeedingTaxonomy: async () => [
      {
        id: 1,
        slug: 'resume-web',
        ghOwner: 'xenodeve',
        ghRepo: 'resume_web',
        description: null,
        categoryId: null,
        categoryOwner: 'auto',
        tagsOwner: 'auto',
        technologiesOwner: 'auto',
        readmeSha: null,
      },
    ],
    getContent: async () => ({
      titleOwner: 'auto',
      titleEnOwner: 'auto',
      descriptionOwner: 'auto',
      contentOwner: 'auto',
      categoryOwner: 'auto',
      tagsOwner: 'auto',
      technologiesOwner: 'auto',
      readmeSha: null,
    }),
    applyPatch: async (slug) => {
      applied.push(slug);
    },
  };
  const readme: TaxonomyReadmeReader = {
    getRepoReadme: async () => ({
      data: { markdown: 'Bun runtime', sha: 's1' },
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
        category: 'Web',
        tags: ['x'],
        technologies: ['Bun'],
      }),
  };
  return {
    c: new TaxonomyGenerateController(store, readme, llm),
    applied,
  };
}

describe('TaxonomyGenerateController (#159)', () => {
  const prev = process.env.GITHUB_REFRESH_SECRET;
  beforeEach(() => {
    process.env.GITHUB_REFRESH_SECRET = 'right';
  });
  afterEach(() => {
    if (prev === undefined) delete process.env.GITHUB_REFRESH_SECRET;
    else process.env.GITHUB_REFRESH_SECRET = prev;
  });

  it('rejects a wrong secret', async () => {
    const { c } = make();
    await expect(c.run('wrong', {})).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
  });

  it('dry-run generates counts but does not persist', async () => {
    const { c, applied } = make();
    const res = await c.run('right', {});
    expect(res.applied).toBe(false);
    expect(res.generated).toBe(1);
    expect(applied).toHaveLength(0);
  });

  it('apply:true persists', async () => {
    const { c, applied } = make();
    const res = await c.run('right', { apply: true });
    expect(res.applied).toBe(true);
    expect(res.generated).toBe(1);
    expect(applied).toEqual(['resume-web']);
  });
});
