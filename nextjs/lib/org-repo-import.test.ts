import { test, expect, describe } from 'bun:test';
import {
  orgRepoToProjectInsert,
  availableOrgReposToImport,
  resolveOrgRepoFromSnapshot,
  parseOrgReposFromTeamPayload,
  orgReposToBulkInserts,
  type OrgRepoInput,
  type ExistingProjectIdentity,
} from './org-repo-import';

const NOW = '2026-07-24T00:00:00.000Z';
const ORG = 'Slow-Inc';

describe('orgRepoToProjectInsert', () => {
  test('maps a Slow-Inc org repo to a published team-owned github project row', () => {
    const row = orgRepoToProjectInsert(
      {
        name: 'MangaDock',
        htmlUrl: 'https://github.com/Slow-Inc/MangaDock',
        description: 'AI manga translation',
        homepage: 'mangadock.example',
      },
      NOW,
      ORG,
    );
    expect(row).toEqual({
      slug: 'mangadock',
      title: 'MangaDock',
      description: 'AI manga translation',
      source: 'github',
      status: 'published',
      published_at: NOW,
      gh_owner: 'Slow-Inc',
      gh_repo: 'MangaDock',
      gh_html_url: 'https://github.com/Slow-Inc/MangaDock',
      live_url: 'https://mangadock.example',
      owner_type: 'team',
      owner_login: 'Slow-Inc',
      is_featured: false,
    });
  });

  test('maps missing homepage to null live_url', () => {
    const row = orgRepoToProjectInsert(
      {
        name: 'Bare',
        htmlUrl: 'https://github.com/Slow-Inc/Bare',
        description: null,
      },
      NOW,
      ORG,
    );
    expect(row.live_url).toBeNull();
  });
});

describe('availableOrgReposToImport', () => {
  const repos: OrgRepoInput[] = [
    {
      name: 'MangaDock',
      htmlUrl: 'https://github.com/Slow-Inc/MangaDock',
      description: null,
    },
    {
      name: 'Website_Prototype01_Frontend',
      htmlUrl: 'https://github.com/Slow-Inc/Website_Prototype01_Frontend',
      description: null,
    },
  ];

  test('drops repos already present by slug or by gh_owner/gh_repo identity', () => {
    const existing: ExistingProjectIdentity[] = [
      { slug: 'mangadock', ghOwner: 'Slow-Inc', ghRepo: 'MangaDock' },
    ];
    expect(availableOrgReposToImport(repos, existing).map((r) => r.name)).toEqual([
      'Website_Prototype01_Frontend',
    ]);
  });

  test('also excludes when only the canonical GitHub identity matches (slug differs)', () => {
    const existing: ExistingProjectIdentity[] = [
      { slug: 'old-manga-slug', ghOwner: 'Slow-Inc', ghRepo: 'MangaDock' },
    ];
    expect(availableOrgReposToImport(repos, existing).map((r) => r.name)).toEqual([
      'Website_Prototype01_Frontend',
    ]);
  });
});

describe('orgReposToBulkInserts', () => {
  test('maps only the available missing set to published team rows (bulk idempotent input)', () => {
    const catalogue: OrgRepoInput[] = [
      {
        name: 'MangaDock',
        htmlUrl: 'https://github.com/Slow-Inc/MangaDock',
        description: 'a',
      },
      {
        name: 'Website_Prototype01_Frontend',
        htmlUrl: 'https://github.com/Slow-Inc/Website_Prototype01_Frontend',
        description: 'b',
      },
    ];
    const existing: ExistingProjectIdentity[] = [
      { slug: 'mangadock', ghOwner: 'Slow-Inc', ghRepo: 'MangaDock' },
    ];
    const rows = orgReposToBulkInserts(catalogue, existing, NOW, ORG);
    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({
      slug: 'website-prototype01-frontend',
      title: 'Website_Prototype01_Frontend',
      source: 'github',
      status: 'published',
      published_at: NOW,
      gh_owner: 'Slow-Inc',
      gh_repo: 'Website_Prototype01_Frontend',
      owner_type: 'team',
      owner_login: 'Slow-Inc',
    });
  });

  test('returns an empty list when nothing is missing (retry is a no-op)', () => {
    const catalogue: OrgRepoInput[] = [
      {
        name: 'MangaDock',
        htmlUrl: 'https://github.com/Slow-Inc/MangaDock',
        description: null,
      },
    ];
    const existing: ExistingProjectIdentity[] = [
      { slug: 'mangadock', ghOwner: 'Slow-Inc', ghRepo: 'MangaDock' },
    ];
    expect(orgReposToBulkInserts(catalogue, existing, NOW, ORG)).toEqual([]);
  });
});

describe('resolveOrgRepoFromSnapshot', () => {
  const snapshot = [
    {
      name: 'MangaDock',
      html_url: 'https://github.com/Slow-Inc/MangaDock',
      description: 'AI manga',
      owner: { login: 'Slow-Inc' },
    },
    {
      name: 'other',
      html_url: 'https://github.com/Else/other',
      description: null,
      owner: { login: 'Else' },
    },
  ];

  test('returns the org repo when owner/repo are in the Slow-Inc snapshot', () => {
    expect(resolveOrgRepoFromSnapshot(snapshot, 'Slow-Inc', 'MangaDock', ORG)).toEqual({
      name: 'MangaDock',
      htmlUrl: 'https://github.com/Slow-Inc/MangaDock',
      description: 'AI manga',
      homepage: null,
    });
  });

  test('rejects forged owner/repo that are not in the Slow-Inc snapshot', () => {
    expect(resolveOrgRepoFromSnapshot(snapshot, 'Evil', 'MangaDock', ORG)).toBeNull();
    expect(resolveOrgRepoFromSnapshot(snapshot, 'Slow-Inc', 'not-real', ORG)).toBeNull();
    expect(resolveOrgRepoFromSnapshot(snapshot, 'Else', 'other', ORG)).toBeNull();
  });

  test('returns null for missing or malformed snapshot data', () => {
    expect(resolveOrgRepoFromSnapshot(null, 'Slow-Inc', 'MangaDock', ORG)).toBeNull();
    expect(resolveOrgRepoFromSnapshot({ nope: true }, 'Slow-Inc', 'MangaDock', ORG)).toBeNull();
  });
  test('threads homepage from the Slow-Inc snapshot into OrgRepoInput', () => {
    const snapshot = [
      {
        name: 'MangaDock',
        html_url: 'https://github.com/Slow-Inc/MangaDock',
        description: 'AI manga',
        homepage: 'mangadock.app',
        owner: { login: 'Slow-Inc' },
      },
    ];
    expect(resolveOrgRepoFromSnapshot(snapshot, 'Slow-Inc', 'MangaDock', ORG)).toEqual({
      name: 'MangaDock',
      htmlUrl: 'https://github.com/Slow-Inc/MangaDock',
      description: 'AI manga',
      homepage: 'mangadock.app',
    });
  });
});

describe('parseOrgReposFromTeamPayload', () => {
  test('extracts Slow-Inc repos from /github/team org ReadResult shape', () => {
    const body = {
      org: {
        data: [
          {
            name: 'MangaDock',
            html_url: 'https://github.com/Slow-Inc/MangaDock',
            description: 'x',
            owner: { login: 'Slow-Inc' },
          },
          {
            name: 'forked',
            html_url: 'https://github.com/Slow-Inc/forked',
            description: null,
            owner: { login: 'SomeoneElse' },
          },
        ],
        stale: false,
      },
      members: [],
    };
    expect(parseOrgReposFromTeamPayload(body, ORG)).toEqual([
      {
        name: 'MangaDock',
        htmlUrl: 'https://github.com/Slow-Inc/MangaDock',
        description: 'x',
        homepage: null,
      },
    ]);
  });

  test('returns null when org snapshot is missing', () => {
    expect(parseOrgReposFromTeamPayload({ org: null, members: [] }, ORG)).toBeNull();
    expect(parseOrgReposFromTeamPayload(null, ORG)).toBeNull();
  });
});
