import { describe, expect, test } from 'bun:test';
import {
  applyMemberProjectSelectionToggle,
  planHistoricalShowcaseUnpublish,
  planShowcaseSelectionSync,
  type ShowcaseProjectCandidate,
} from './member-showcase-sync';

function personal(
  over: Partial<ShowcaseProjectCandidate> = {},
): ShowcaseProjectCandidate {
  return {
    id: 10,
    status: 'published',
    source: 'github',
    ownerType: 'personal',
    ownerLogin: 'xenodeve',
    ghOwner: 'xenodeve',
    ghRepo: 'resume_web',
    ghHtmlUrl: 'https://github.com/xenodeve/resume_web',
    ...over,
  };
}

describe('planShowcaseSelectionSync (#179)', () => {
  const memberLogin = 'xenodeve';
  const repoUrl = 'https://github.com/xenodeve/resume_web';

  test('deselect unpublishes a matching personal published row', () => {
    expect(
      planShowcaseSelectionSync({
        selected: false,
        memberGithubLogin: memberLogin,
        memberRepoUrl: repoUrl,
        projects: [personal()],
      }),
    ).toEqual({ action: 'unpublish', projectId: 10 });
  });

  test('select republishes a matching personal hidden/draft row', () => {
    expect(
      planShowcaseSelectionSync({
        selected: true,
        memberGithubLogin: memberLogin,
        memberRepoUrl: repoUrl,
        projects: [personal({ status: 'hidden' })],
      }),
    ).toEqual({ action: 'republish', projectId: 10 });
  });

  test('select with already-published match is noop', () => {
    expect(
      planShowcaseSelectionSync({
        selected: true,
        memberGithubLogin: memberLogin,
        memberRepoUrl: repoUrl,
        projects: [personal()],
      }),
    ).toEqual({ action: 'noop' });
  });

  test('deselect with no matching projects row is noop (no auto-create inverse)', () => {
    expect(
      planShowcaseSelectionSync({
        selected: false,
        memberGithubLogin: memberLogin,
        memberRepoUrl: repoUrl,
        projects: [],
      }),
    ).toEqual({ action: 'noop' });
  });

  test('never targets team/org showcase rows', () => {
    expect(
      planShowcaseSelectionSync({
        selected: false,
        memberGithubLogin: memberLogin,
        memberRepoUrl: 'https://github.com/Slow-Inc/MangaDock',
        projects: [
          personal({
            id: 1,
            ownerType: 'team',
            ownerLogin: 'Slow-Inc',
            ghOwner: 'Slow-Inc',
            ghRepo: 'MangaDock',
            ghHtmlUrl: 'https://github.com/Slow-Inc/MangaDock',
          }),
        ],
      }),
    ).toEqual({ action: 'noop' });
  });

  test('matches by GitHub identity case-insensitively', () => {
    expect(
      planShowcaseSelectionSync({
        selected: false,
        memberGithubLogin: 'XenoDeve',
        memberRepoUrl: 'https://github.com/XenoDeve/Resume_Web',
        projects: [personal()],
      }),
    ).toEqual({ action: 'unpublish', projectId: 10 });
  });

  test('ignores personal rows owned by a different github login', () => {
    expect(
      planShowcaseSelectionSync({
        selected: false,
        memberGithubLogin: 'xenodeve',
        memberRepoUrl: 'https://github.com/other/resume_web',
        projects: [
          personal({
            ownerLogin: 'other',
            ghOwner: 'other',
            ghHtmlUrl: 'https://github.com/other/resume_web',
          }),
        ],
      }),
    ).toEqual({ action: 'noop' });
  });
});

describe('applyMemberProjectSelectionToggle (#180)', () => {
  test('deselect updates selected and unpublishes the planned project', async () => {
    const statuses: { id: number; status: string }[] = [];
    const selectedWrites: { id: number; selected: boolean }[] = [];
    let revalidated = 0;
    const store = {
      getMemberProject: async () => ({
        id: 5,
        url: 'https://github.com/xenodeve/resume_web',
        memberId: 1,
      }),
      getMemberGithubLogin: async () => 'xenodeve',
      listPersonalGithubProjects: async () => [
        {
          id: 10,
          status: 'published',
          source: 'github',
          ownerType: 'personal',
          ownerLogin: 'xenodeve',
          ghOwner: 'xenodeve',
          ghRepo: 'resume_web',
          ghHtmlUrl: 'https://github.com/xenodeve/resume_web',
        },
      ],
      setMemberProjectSelected: async (id: number, selected: boolean) => {
        selectedWrites.push({ id, selected });
      },
      setProjectStatus: async (id: number, status: string) => {
        statuses.push({ id, status });
      },
    };
    const res = await applyMemberProjectSelectionToggle({
      memberProjectId: 5,
      selected: false,
      store,
      revalidate: () => {
        revalidated++;
      },
    });
    expect(res).toEqual({
      ok: true,
      plan: { action: 'unpublish', projectId: 10 },
    });
    expect(selectedWrites).toEqual([{ id: 5, selected: false }]);
    expect(statuses).toEqual([{ id: 10, status: 'hidden' }]);
    expect(revalidated).toBe(1);
  });

  test('select with no showcase row only flips selected (noop plan)', async () => {
    const statuses: unknown[] = [];
    let revalidated = 0;
    const res = await applyMemberProjectSelectionToggle({
      memberProjectId: 5,
      selected: true,
      store: {
        getMemberProject: async () => ({
          id: 5,
          url: 'https://github.com/xenodeve/new-repo',
          memberId: 1,
        }),
        getMemberGithubLogin: async () => 'xenodeve',
        listPersonalGithubProjects: async () => [],
        setMemberProjectSelected: async () => {},
        setProjectStatus: async (...args: unknown[]) => {
          statuses.push(args);
        },
      },
      revalidate: () => {
        revalidated++;
      },
    });
    expect(res).toEqual({ ok: true, plan: { action: 'noop' } });
    expect(statuses).toEqual([]);
    expect(revalidated).toBe(0);
  });
});

describe('planHistoricalShowcaseUnpublish (#182)', () => {
  test('unpublishes personal published rows whose member_projects.selected is false', () => {
    expect(
      planHistoricalShowcaseUnpublish({
        memberRepos: [
          {
            url: 'https://github.com/xenodeve/old',
            selected: false,
            memberGithubLogin: 'xenodeve',
          },
        ],
        projects: [
          {
            id: 3,
            status: 'published',
            source: 'github',
            ownerType: 'personal',
            ownerLogin: 'xenodeve',
            ghOwner: 'xenodeve',
            ghRepo: 'old',
            ghHtmlUrl: 'https://github.com/xenodeve/old',
          },
        ],
      }),
    ).toEqual([{ action: 'unpublish', projectId: 3 }]);
  });

  test('skips selected=true and team rows', () => {
    expect(
      planHistoricalShowcaseUnpublish({
        memberRepos: [
          {
            url: 'https://github.com/xenodeve/keep',
            selected: true,
            memberGithubLogin: 'xenodeve',
          },
          {
            url: 'https://github.com/Slow-Inc/MangaDock',
            selected: false,
            memberGithubLogin: 'xenodeve',
          },
        ],
        projects: [
          {
            id: 1,
            status: 'published',
            source: 'github',
            ownerType: 'personal',
            ownerLogin: 'xenodeve',
            ghOwner: 'xenodeve',
            ghRepo: 'keep',
            ghHtmlUrl: 'https://github.com/xenodeve/keep',
          },
          {
            id: 2,
            status: 'published',
            source: 'github',
            ownerType: 'team',
            ownerLogin: 'Slow-Inc',
            ghOwner: 'Slow-Inc',
            ghRepo: 'MangaDock',
            ghHtmlUrl: 'https://github.com/Slow-Inc/MangaDock',
          },
        ],
      }),
    ).toEqual([]);
  });
});
