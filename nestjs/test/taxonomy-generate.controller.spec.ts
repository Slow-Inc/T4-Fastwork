import { describe, it, expect, beforeEach, afterEach } from 'bun:test';
import { UnauthorizedException } from '@nestjs/common';
import { TaxonomyGenerateController } from '../src/github/taxonomy-generate.controller';
import type {
  TaxonomyLlm,
  TaxonomyReadmeReader,
  TaxonomyStore,
} from '../src/github/taxonomy-generate';

function candidate(slug: string, repo: string) {
  return {
    id: 1,
    slug,
    ghOwner: 'xenodeve',
    ghRepo: repo,
    description: null,
    categoryId: null,
    categoryOwner: 'auto' as const,
    tagsOwner: 'auto' as const,
    technologiesOwner: 'auto' as const,
    readmeSha: null,
  };
}

function make(
  over: {
    candidates?: ReturnType<typeof candidate>[];
    /** Repos that have no README on GitHub at all — the #211 case. */
    withoutReadme?: string[];
  } = {},
) {
  const applied: string[] = [];
  const store: TaxonomyStore = {
    listPublishedNeedingTaxonomy: async () =>
      over.candidates ?? [candidate('resume-web', 'resume_web')],
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
    getRepoReadme: async (_owner, repo) =>
      (over.withoutReadme ?? []).includes(repo)
        ? null
        : { data: { markdown: 'Bun runtime', sha: 's1' }, stale: false },
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

  // #211 — reproduces production: the un-enrichable row sorts FIRST (it is the newest publish),
  // the cap is 1, and its skip costs no LLM call so it does not consume the cap. The run therefore
  // generates a different project and reports total success, while the row that can never be
  // enriched is skipped again. The response has to name it or nobody finds out.
  it('names published candidates whose repo has no README at all', async () => {
    const { c, applied } = make({
      candidates: [
        candidate('t4-fastwork', 'T4-Fastwork'),
        candidate('resume-web', 'resume_web'),
      ],
      withoutReadme: ['T4-Fastwork'],
    });

    const res = await c.run('right', { apply: true });

    expect(res.candidates).toBe(2);
    expect(res.generated).toBe(1);
    expect(applied).toEqual(['resume-web']);
    // The cap was not spent on the row that could not generate…
    expect(res.noReadmeSlugs).toEqual(['t4-fastwork']);
  });

  it('reports no blocked slugs when every candidate has a README', async () => {
    const { c } = make();
    const res = await c.run('right', { apply: true });
    expect(res.noReadmeSlugs).toEqual([]);
  });
});
