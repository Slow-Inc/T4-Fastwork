import { describe, it, expect } from 'bun:test';
import {
  CaseStudySimpleService,
  type CaseStudyProject,
  type CaseStudySimpleStore,
  type ReadmeReader,
  type CompletionLlm,
} from '../src/github/case-study-simple';
import type { GeneratedContent } from '../src/github/github-generate';

const VALID_JSON = JSON.stringify({
  title: 'ชื่อโปรเจกต์',
  titleEn: 'Project Title',
  description: 'สรุปสั้น ๆ',
  content: 'ย่อหน้าแรก\n\nย่อหน้าที่สอง',
  category: 'web',
  tags: ['a'],
  technologies: ['typescript'],
});

function project(over: Partial<CaseStudyProject> = {}): CaseStudyProject {
  return {
    id: 1,
    slug: 'proj',
    ghOwner: 'Slow-Inc',
    ghRepo: 'Repo',
    readmeSha: null,
    description: 'd',
    ...over,
  };
}

function deps(opts: { readme?: unknown; llmReply?: string } = {}) {
  const llmCalls: unknown[] = [];
  const published: {
    projectId: number;
    slug: string;
    gen: GeneratedContent;
    sha: string;
  }[] = [];
  const readme: ReadmeReader = {
    getRepoReadme: async () =>
      opts.readme === undefined ? null : { data: opts.readme, stale: false },
  };
  const llm: CompletionLlm = {
    complete: async (m) => {
      llmCalls.push(m);
      return opts.llmReply ?? VALID_JSON;
    },
  };
  const store: CaseStudySimpleStore = {
    listPublishedGithubProjects: async () => [],
    publishCaseStudy: async (projectId, slug, gen, sha) => {
      published.push({ projectId, slug, gen, sha });
    },
  };
  return { readme, llm, store, llmCalls, published };
}

describe('CaseStudySimpleService.generateForProject', () => {
  it('generates + publishes when the README sha changed', async () => {
    const d = deps({ readme: { markdown: '# readme typescript', sha: 'sha2' } });
    const svc = new CaseStudySimpleService(d.readme, d.llm, d.store);
    const r = await svc.generateForProject(project({ readmeSha: 'sha1' }));
    expect(r.generated).toBe(true);
    expect(d.llmCalls).toHaveLength(1);
    expect(d.published).toHaveLength(1);
    expect(d.published[0]).toMatchObject({ projectId: 1, slug: 'proj', sha: 'sha2' });
  });

  it('skips (0 LLM calls) when the README sha is unchanged — delta gate', async () => {
    const d = deps({ readme: { markdown: '# x', sha: 'same' } });
    const svc = new CaseStudySimpleService(d.readme, d.llm, d.store);
    const r = await svc.generateForProject(project({ readmeSha: 'same' }));
    expect(r.generated).toBe(false);
    expect(d.llmCalls).toHaveLength(0);
    expect(d.published).toHaveLength(0);
  });

  it('skips when there is no README snapshot', async () => {
    const d = deps({ readme: undefined });
    const svc = new CaseStudySimpleService(d.readme, d.llm, d.store);
    const r = await svc.generateForProject(project());
    expect(r.generated).toBe(false);
    expect(d.llmCalls).toHaveLength(0);
  });

  it('skips a project with no GitHub linkage', async () => {
    const d = deps({ readme: { markdown: 'x', sha: 's' } });
    const svc = new CaseStudySimpleService(d.readme, d.llm, d.store);
    const r = await svc.generateForProject(project({ ghOwner: null }));
    expect(r.generated).toBe(false);
    expect(d.llmCalls).toHaveLength(0);
  });

  it('drops technologies not evidenced by the README (hallucination/injection guard)', async () => {
    const reply = JSON.stringify({
      title: 'ก',
      titleEn: 'A',
      description: 'ข',
      content: 'ค\n\nง',
      category: 'web',
      tags: [],
      technologies: ['TypeScript', 'COBOL'],
    });
    const d = deps({
      readme: { markdown: 'we use typescript here', sha: 'new' },
      llmReply: reply,
    });
    const svc = new CaseStudySimpleService(d.readme, d.llm, d.store);
    await svc.generateForProject(project({ readmeSha: 'old' }));
    expect(d.published[0].gen.technologies).toEqual(['TypeScript']); // COBOL dropped
  });
});
