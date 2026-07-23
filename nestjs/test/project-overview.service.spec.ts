import { describe, it, expect } from 'bun:test';
import {
  ProjectOverviewService,
  type OverviewLlm,
  type OverviewProject,
  type OverviewReadmeReader,
  type OverviewStore,
} from '../src/github/project-overview.service';

const overviewJson = JSON.stringify({
  summary: 'ส',
  highlights: 'ห',
  goodFor: 'ก',
  summaryEn: 'S',
  highlightsEn: 'H',
  goodForEn: 'G',
});

function make(over: { project?: Partial<OverviewProject> } = {}) {
  const applied: unknown[] = [];
  const project: OverviewProject = {
    id: 1,
    slug: 'mangadock',
    ghOwner: 'Slow-Inc',
    ghRepo: 'MangaDock',
    description: 'd',
    overviewSummary: null,
    overviewOwner: 'auto',
    ...over.project,
  };
  let llmCalls = 0;
  const llm: OverviewLlm = {
    complete: async () => {
      llmCalls++;
      return overviewJson;
    },
  };
  const readme: OverviewReadmeReader = {
    getRepoReadme: async () => ({
      data: { markdown: '# hi', sha: 'abc' },
      stale: false,
    }),
  };
  const store: OverviewStore = {
    listPublishedGithubProjects: async () => [project],
    applyOverview: async (id, o) => {
      applied.push({ id, o });
    },
  };
  return {
    svc: new ProjectOverviewService(readme, llm, store),
    project,
    applied,
    llmCalls: () => llmCalls,
  };
}

describe('ProjectOverviewService generateForProject (#130)', () => {
  it('persists a structured overview for an empty auto-owned card', async () => {
    const { svc, project, applied, llmCalls } = make();
    const r = await svc.generateForProject(project);
    expect(r.generated).toBe(true);
    expect(llmCalls()).toBe(1);
    expect(applied).toHaveLength(1);
  });

  it('skips when an overview already exists (no second LLM)', async () => {
    const { svc, project, llmCalls } = make({
      project: { overviewSummary: 'already' },
    });
    await expect(svc.generateForProject(project)).resolves.toEqual({
      generated: false,
    });
    expect(llmCalls()).toBe(0);
  });

  it('skips when overview_owner is human', async () => {
    const { svc, project, llmCalls } = make({
      project: { overviewOwner: 'human' },
    });
    await expect(svc.generateForProject(project)).resolves.toEqual({
      generated: false,
    });
    expect(llmCalls()).toBe(0);
  });
});
