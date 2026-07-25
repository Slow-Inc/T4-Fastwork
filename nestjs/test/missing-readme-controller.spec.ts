import { describe, it, expect, beforeEach, afterEach } from 'bun:test';
import { UnauthorizedException } from '@nestjs/common';
import { GithubWriteController } from '../src/github/github-write.controller';
import { README_MARKER_TTL_MS } from '../src/github/missing-readme-backfill';
import type { GithubRefreshService } from '../src/github/github-refresh.service';
import type {
  MissingReadmeStore,
  ProjectGithubSlugLookup,
} from '../src/github/pg-showcase-repos.store';

function makeController(over: {
  listPublished?: MissingReadmeStore['listPublishedGithubForReadmeBackfill'];
  listStates?: MissingReadmeStore['listReadmeSnapshotStates'];
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
    listReadmeSnapshotStates:
      over.listStates ??
      (async () => [
        {
          key: 'repo:Slow-Inc/MangaDock:readme',
          missing: false,
          checkedAt: null,
        },
      ]),
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

  // #177 — a repo with no README used to be reported as a plain success, so an operator could
  // not tell real progress from a repo that will never have content.
  it('reports a repo with no README separately from one that gained a README', async () => {
    const { c } = makeController({
      refreshRepoDetail: (async (owner: string, repo: string) => ({
        synced: [`repo:${owner}/${repo}:readme`],
        changed: [],
        failed: [],
        readmeSha: null,
        readmeMissing: true,
      })) as unknown as GithubRefreshService['refreshRepoDetail'],
    });

    const res = await c.doRefreshMissingReadme('right', { apply: true });

    expect(res.synced).toBe(1);
    expect(res.noReadme).toBe(1);
    expect(res.withReadme).toBe(0);
    expect(res.failed).toBe(0);
  });

  it('counts a repo that did gain a README as withReadme', async () => {
    const { c } = makeController();
    const res = await c.doRefreshMissingReadme('right', { apply: true });
    expect(res.withReadme).toBe(1);
    expect(res.noReadme).toBe(0);
  });

  // #215 — a #177 missing-marker is a readme key, so it used to exclude its repo from this backfill
  // forever. A repo that later gains a README then lost the one step built to fetch it and had to
  // wait for the broad refresh's rotating 8-repo budget. An expired marker must re-enter the queue.
  it('re-selects a repo whose missing-marker has expired', async () => {
    const stale = new Date(Date.now() - (README_MARKER_TTL_MS + 60_000));
    const { c, detailCalls } = makeController({
      listPublished: async () => [
        { owner: 'Slow-Inc', repo: 'T4-Fastwork', slug: 't4-fastwork' },
      ],
      listStates: async () => [
        {
          key: 'repo:Slow-Inc/T4-Fastwork:readme',
          missing: true,
          checkedAt: stale,
        },
      ],
    });

    const res = await c.doRefreshMissingReadme('right', { apply: true });

    expect(res.candidates).toBe(1);
    expect(detailCalls).toEqual(['Slow-Inc/T4-Fastwork']);
  });

  it('still skips a repo whose missing-marker is fresh, so a README-less repo is not re-fetched hourly', async () => {
    const { c, detailCalls } = makeController({
      listPublished: async () => [
        { owner: 'Slow-Inc', repo: 'T4-Fastwork', slug: 't4-fastwork' },
      ],
      listStates: async () => [
        {
          key: 'repo:Slow-Inc/T4-Fastwork:readme',
          missing: true,
          checkedAt: new Date(),
        },
      ],
    });

    const res = await c.doRefreshMissingReadme('right', { apply: true });

    expect(res.candidates).toBe(0);
    expect(detailCalls).toEqual([]);
  });
});
