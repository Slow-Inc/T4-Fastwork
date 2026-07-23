import { describe, it, expect, beforeEach, afterEach } from 'bun:test';
import { UnauthorizedException } from '@nestjs/common';
import { GithubWriteController } from '../src/github/github-write.controller';
import type { GithubRefreshService } from '../src/github/github-refresh.service';
import type {
  MissingReadmeStore,
  ProjectGithubSlugLookup,
} from '../src/github/pg-showcase-repos.store';

function makeController(over: {
  listPublished?: MissingReadmeStore['listPublishedGithubForReadmeBackfill'];
  listExistingKeys?: MissingReadmeStore['listExistingReadmeKeys'];
  refreshRepoDetail?: GithubRefreshService['refreshRepoDetail'];
  exclusive?: (
    name: string,
    fn: () => Promise<unknown>,
  ) => Promise<{ ran: boolean; result?: unknown }>;
} = {}) {
  const detailCalls: string[] = [];
  const exclusiveNames: string[] = [];

  const refresh = {
    refreshAll: async () => ({ synced: [], changed: [], failed: [] }),
    refreshRepoDetail:
      over.refreshRepoDetail ??
      (async (owner: string, repo: string) => {
        detailCalls.push(`${owner}/${repo}`);
        return {
          synced: [`repo:${owner}/${repo}:readme`],
          changed: [`repo:${owner}/${repo}:readme`],
          failed: [],
          readmeSha: 'abc',
        };
      }),
  } as unknown as GithubRefreshService;

  const store = {
    runExclusive:
      over.exclusive ??
      (async (name: string, fn: () => Promise<unknown>) => {
        exclusiveNames.push(name);
        return { ran: true, result: await fn() };
      }),
  };

  const projects: ProjectGithubSlugLookup & MissingReadmeStore = {
    findPublishedSlugByGithub: async () => null,
    listPublishedGithubForReadmeBackfill:
      over.listPublished ??
      (async () => [
        { owner: 'Slow-Inc', repo: 'MangaDock', slug: 'mangadock' },
        { owner: 'xenodeve', repo: 'resume_web', slug: 'resume-web' },
        { owner: 'Slow-Inc', repo: 'Other', slug: 'other' },
      ]),
    listExistingReadmeKeys:
      over.listExistingKeys ??
      (async () => new Set(['repo:Slow-Inc/MangaDock:readme'])),
  };

  const revalidate = {
    revalidateProjects: async () => true,
    revalidateProject: async () => true,
    revalidateContent: async () => true,
  };

  const c = new GithubWriteController(
    refresh,
    {} as never,
    {} as never,
    store as never,
    { reingest: async () => {} } as never,
    revalidate as never,
    projects as never,
  );

  return { c, detailCalls, exclusiveNames };
}

describe('GithubWriteController.doRefreshMissingReadme (#158)', () => {
  const prevSecret = process.env.GITHUB_REFRESH_SECRET;
  const prevCap = process.env.README_BACKFILL_MAX_PER_RUN;

  beforeEach(() => {
    process.env.GITHUB_REFRESH_SECRET = 'right';
    delete process.env.README_BACKFILL_MAX_PER_RUN;
  });
  afterEach(() => {
    if (prevSecret === undefined) delete process.env.GITHUB_REFRESH_SECRET;
    else process.env.GITHUB_REFRESH_SECRET = prevSecret;
    if (prevCap === undefined) delete process.env.README_BACKFILL_MAX_PER_RUN;
    else process.env.README_BACKFILL_MAX_PER_RUN = prevCap;
  });

  it('rejects a wrong secret', async () => {
    const { c } = makeController();
    await expect(c.doRefreshMissingReadme('wrong', {})).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
  });

  it('dry-run lists planned repos without calling GitHub detail sync', async () => {
    const { c, detailCalls, exclusiveNames } = makeController();
    const res = await c.doRefreshMissingReadme('right', {});
    expect(res.applied).toBe(false);
    expect(res.candidates).toBe(2);
    expect(res.planned).toBe(1); // default cap 1
    expect(res.synced).toBe(0);
    expect(res.capped).toBe(true);
    expect(res.repos).toEqual([
      { owner: 'xenodeve', repo: 'resume_web', slug: 'resume-web' },
    ]);
    expect(detailCalls).toEqual([]);
    expect(exclusiveNames).toEqual([]);
  });

  it('apply:true syncs up to the cap under a single-flight lock', async () => {
    const { c, detailCalls, exclusiveNames } = makeController();
    const res = await c.doRefreshMissingReadme('right', { apply: true });
    expect(res.applied).toBe(true);
    expect(res.synced).toBe(1);
    expect(detailCalls).toEqual(['xenodeve/resume_web']);
    expect(exclusiveNames).toEqual(['github-refresh-missing-readme']);
  });
});
