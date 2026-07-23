import { describe, it, expect, beforeEach, afterEach } from 'bun:test';
import { UnauthorizedException, BadRequestException } from '@nestjs/common';
import { GithubWriteController } from '../src/github/github-write.controller';
import type { GithubRefreshService } from '../src/github/github-refresh.service';
import type { ProjectGithubSlugLookup } from '../src/github/pg-showcase-repos.store';

function makeController(over: {
  refreshRepoDetail?: GithubRefreshService['refreshRepoDetail'];
  findSlug?: ProjectGithubSlugLookup['findPublishedSlugByGithub'];
  exclusive?: (
    name: string,
    fn: () => Promise<unknown>,
  ) => Promise<{ ran: boolean; result?: unknown }>;
  revalidateSlug?: (slug: string) => Promise<boolean>;
  revalidateAll?: () => Promise<boolean>;
  reingest?: () => Promise<void>;
} = {}) {
  const listSyncCalls: string[] = [];
  const revalidateSlugs: string[] = [];
  const revalidateAllCalls: number[] = [];
  const reingestCalls: number[] = [];
  const exclusiveNames: string[] = [];

  const refresh = {
    refreshAll: async () => {
      listSyncCalls.push('refreshAll');
      return { synced: [], changed: [], failed: [] };
    },
    refreshRepoDetail:
      over.refreshRepoDetail ??
      (async (owner: string, repo: string) => ({
        synced: [
          `repo:${owner}/${repo}:contributors`,
          `repo:${owner}/${repo}:pulls`,
          `languages:${owner}/${repo}`,
          `repo:${owner}/${repo}:readme`,
        ],
        changed: [],
        failed: [],
        readmeSha: 'sha',
      })),
  } as unknown as GithubRefreshService;

  const store = {
    runExclusive:
      over.exclusive ??
      (async (name: string, fn: () => Promise<unknown>) => {
        exclusiveNames.push(name);
        return { ran: true, result: await fn() };
      }),
  };

  const projects: ProjectGithubSlugLookup = {
    findPublishedSlugByGithub:
      over.findSlug ?? (async () => 'mangadock'),
  };

  const revalidate = {
    revalidateProjects:
      over.revalidateAll ??
      (async () => {
        revalidateAllCalls.push(1);
        return true;
      }),
    revalidateProject:
      over.revalidateSlug ??
      (async (slug: string) => {
        revalidateSlugs.push(slug);
        return true;
      }),
    revalidateContent: async () => true,
  };

  const rag = {
    reingest:
      over.reingest ??
      (async () => {
        reingestCalls.push(1);
      }),
  };

  const c = new GithubWriteController(
    refresh,
    {} as never,
    {} as never,
    store as never,
    rag as never,
    revalidate as never,
    projects,
  );

  return {
    c,
    listSyncCalls,
    revalidateSlugs,
    revalidateAllCalls,
    reingestCalls,
    exclusiveNames,
  };
}

describe('GithubWriteController.doRefreshRepoDetail (#143)', () => {
  const prev = process.env.GITHUB_REFRESH_SECRET;

  beforeEach(() => {
    process.env.GITHUB_REFRESH_SECRET = 'right';
  });
  afterEach(() => {
    if (prev === undefined) delete process.env.GITHUB_REFRESH_SECRET;
    else process.env.GITHUB_REFRESH_SECRET = prev;
  });

  it('rejects a wrong / missing secret (fail-closed)', async () => {
    const { c } = makeController();
    await expect(c.doRefreshRepoDetail('wrong', 'Slow-Inc', 'MangaDock')).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
    delete process.env.GITHUB_REFRESH_SECRET;
    await expect(c.doRefreshRepoDetail('right', 'Slow-Inc', 'MangaDock')).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
  });

  it('rejects unsafe owner/repo before any sync', async () => {
    const { c, exclusiveNames } = makeController();
    await expect(c.doRefreshRepoDetail('right', 'foo/bar', 'MangaDock')).rejects.toBeInstanceOf(
      BadRequestException,
    );
    expect(exclusiveNames).toEqual([]);
  });

  it('refreshes one repo under a dedicated lock and revalidates only that slug', async () => {
    const { c, listSyncCalls, revalidateSlugs, revalidateAllCalls, reingestCalls, exclusiveNames } =
      makeController();
    const res = (await c.doRefreshRepoDetail(
      'right',
      'Slow-Inc',
      'MangaDock',
    )) as Record<string, unknown>;

    expect(exclusiveNames).toEqual(['github-refresh-repo-detail:slow-inc/mangadock']);
    expect(listSyncCalls).toEqual([]);
    expect(revalidateSlugs).toEqual(['mangadock']);
    expect(revalidateAllCalls).toEqual([]);
    expect(reingestCalls).toEqual([]);
    expect(res).toMatchObject({
      owner: 'Slow-Inc',
      repo: 'MangaDock',
      projectSlug: 'mangadock',
    });
  });

  it('skips project revalidation when no published project matches', async () => {
    const { c, revalidateSlugs } = makeController({
      findSlug: async () => null,
    });
    const res = (await c.doRefreshRepoDetail(
      'right',
      'Slow-Inc',
      'Unknown',
    )) as Record<string, unknown>;
    expect(revalidateSlugs).toEqual([]);
    expect(res.projectSlug).toBeNull();
  });
});
