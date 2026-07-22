import { describe, it, expect } from 'bun:test';
import { CaseStudySimpleController } from '../src/github/case-study-simple.controller';
import type {
  CaseStudyProject,
  CaseStudySimpleStore,
  ReadmeReader,
  CompletionLlm,
} from '../src/github/case-study-simple';

const VALID = JSON.stringify({
  title: 'ก',
  titleEn: 'A',
  description: 'ข',
  content: 'ค\n\nง',
  category: 'web',
  tags: [],
  technologies: ['ts'],
});

function make(over: { projects?: CaseStudyProject[] } = {}) {
  const writes: number[] = [];
  const store: CaseStudySimpleStore = {
    listPublishedGithubProjects: async () =>
      over.projects ?? [
        { id: 1, slug: 'a', ghOwner: 'o', ghRepo: 'r', readmeSha: 'old', description: null },
      ],
    publishCaseStudy: async (id) => {
      writes.push(id);
    },
  };
  const readme: ReadmeReader = {
    getRepoReadme: async () => ({ data: { markdown: 'ts', sha: 'new' }, stale: false }),
  };
  const llm: CompletionLlm = { complete: async () => VALID };
  return { c: new CaseStudySimpleController(readme, llm, store), writes };
}

describe('CaseStudySimpleController', () => {
  it('rejects a wrong secret (fail-closed)', async () => {
    process.env.GITHUB_REFRESH_SECRET = 'right';
    const { c } = make();
    await expect(c.run('wrong', {})).rejects.toThrow();
  });

  it('rejects when the secret is unset (fail-closed)', async () => {
    delete process.env.GITHUB_REFRESH_SECRET;
    const { c } = make();
    await expect(c.run('anything', {})).rejects.toThrow();
  });

  it('dry-run reports would-generate counts but does NOT persist', async () => {
    process.env.GITHUB_REFRESH_SECRET = 'right';
    const { c, writes } = make();
    const res = await c.run('right', {});
    expect(res.applied).toBe(false);
    expect(res.candidates).toBe(1);
    expect(res.generated).toBe(1);
    expect(writes).toHaveLength(0); // nothing written in dry-run
  });

  it('a truthy-but-not-true apply value stays dry-run (no prod write)', async () => {
    process.env.GITHUB_REFRESH_SECRET = 'right';
    const { c, writes } = make();
    // e.g. a stringy body from a mis-serialized client — must NOT persist.
    const res = await c.run('right', { apply: 'true' as unknown as boolean });
    expect(res.applied).toBe(false);
    expect(writes).toHaveLength(0);
  });

  it('apply=true persists via the store', async () => {
    process.env.GITHUB_REFRESH_SECRET = 'right';
    const { c, writes } = make();
    const res = await c.run('right', { apply: true });
    expect(res.applied).toBe(true);
    expect(res.generated).toBe(1);
    expect(writes).toEqual([1]);
  });

  it('caps generations per run at CASE_STUDY_MAX_PER_RUN (serverless-timeout guard)', async () => {
    process.env.GITHUB_REFRESH_SECRET = 'right';
    process.env.CASE_STUDY_MAX_PER_RUN = '2';
    const projects: CaseStudyProject[] = Array.from({ length: 6 }, (_, i) => ({
      id: i + 1,
      slug: `p${i}`,
      ghOwner: 'o',
      ghRepo: 'r',
      readmeSha: 'old',
      description: null,
    }));
    const { c, writes } = make({ projects });
    const res = await c.run('right', { apply: true });
    expect(res.generated).toBe(2); // stopped after the cap
    expect(res.attempted).toBe(2);
    expect(res.capped).toBe(true);
    expect(writes).toEqual([1, 2]); // only the first 2 (priority order) written
    delete process.env.CASE_STUDY_MAX_PER_RUN;
  });

  it('is fail-soft: one project throwing does not abort the batch', async () => {
    process.env.GITHUB_REFRESH_SECRET = 'right';
    const projects: CaseStudyProject[] = [
      { id: 1, slug: 'boom', ghOwner: 'o', ghRepo: 'r', readmeSha: 'old', description: null },
      { id: 2, slug: 'ok', ghOwner: 'o', ghRepo: 'r', readmeSha: 'old', description: null },
    ];
    const writes: number[] = [];
    const store: CaseStudySimpleStore = {
      listPublishedGithubProjects: async () => projects,
      publishCaseStudy: async (id) => {
        if (id === 1) throw new Error('boom');
        writes.push(id);
      },
    };
    const readme: ReadmeReader = {
      getRepoReadme: async () => ({ data: { markdown: 'ts', sha: 'new' }, stale: false }),
    };
    const llm: CompletionLlm = { complete: async () => VALID };
    const c = new CaseStudySimpleController(readme, llm, store);
    const res = await c.run('right', { apply: true });
    expect(writes).toEqual([2]); // batch continued past the throw
    expect(res.generated).toBe(1); // only the ok one counted
  });
});
