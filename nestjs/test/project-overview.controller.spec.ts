import { describe, it, expect, beforeEach, afterEach } from 'bun:test';
import { UnauthorizedException } from '@nestjs/common';
import { ProjectOverviewController } from '../src/github/project-overview.controller';
import type {
  OverviewLlm,
  OverviewReadmeReader,
  OverviewStore,
} from '../src/github/project-overview.service';

const overviewJson = JSON.stringify({
  summary: 'ส',
  highlights: 'ห',
  goodFor: 'ก',
  summaryEn: 'S',
  highlightsEn: 'H',
  goodForEn: 'G',
});

function make() {
  const applied: number[] = [];
  const store: OverviewStore = {
    listPublishedGithubProjects: async () => [
      {
        id: 1,
        slug: 'a',
        ghOwner: 'o',
        ghRepo: 'r',
        description: null,
        overviewSummary: null,
        overviewOwner: 'auto',
      },
    ],
    applyOverview: async (id) => {
      applied.push(id);
    },
  };
  const readme: OverviewReadmeReader = {
    getRepoReadme: async () => ({
      data: { markdown: 'md', sha: 's' },
      stale: false,
    }),
  };
  const llm: OverviewLlm = { complete: async () => overviewJson };
  return {
    c: new ProjectOverviewController(readme, llm, store),
    applied,
  };
}

describe('ProjectOverviewController (#130)', () => {
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
    expect(applied).toEqual([1]);
  });
});
