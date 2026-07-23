import { test, expect, describe } from 'bun:test';
import {
  parseGithubUrl,
  slugifyRepo,
  memberRepoToProjectInsert,
  availableToImport,
  type MemberRepoInput,
} from './member-repo-import';

describe('parseGithubUrl', () => {
  test('extracts owner/repo and strips .git', () => {
    expect(parseGithubUrl('https://github.com/xenodeve/resume_web')).toEqual({
      owner: 'xenodeve',
      repo: 'resume_web',
    });
    expect(parseGithubUrl('https://github.com/Slow-Inc/MangaDock.git')).toEqual({
      owner: 'Slow-Inc',
      repo: 'MangaDock',
    });
  });
  test('null for a non-github url', () => {
    expect(parseGithubUrl('https://example.com/x')).toBeNull();
  });
});

describe('memberRepoToProjectInsert', () => {
  const NOW = '2026-07-22T00:00:00.000Z';
  test('maps a selected member repo to a published github-sourced project row', () => {
    const row = memberRepoToProjectInsert(
      {
        name: 'Resume Web',
        url: 'https://github.com/xenodeve/resume_web',
        description: 'portfolio site',
        ownerLogin: 'xenodeve',
        homepage: 'resume.example',
      },
      NOW,
    );
    expect(row.slug).toBe('resume-web');
    expect(row.title).toBe('Resume Web');
    expect(row.source).toBe('github');
    expect(row.status).toBe('published');
    expect(row.published_at).toBe(NOW);
    expect(row.gh_owner).toBe('xenodeve');
    expect(row.gh_repo).toBe('resume_web');
    expect(row.gh_html_url).toBe('https://github.com/xenodeve/resume_web');
    expect(row.live_url).toBe('https://resume.example');
    expect(row.owner_type).toBe('personal');
    expect(row.owner_login).toBe('xenodeve');
    expect(row.is_featured).toBe(false);
  });

  test('maps missing homepage to null live_url', () => {
    const row = memberRepoToProjectInsert(
      {
        name: 'Resume Web',
        url: 'https://github.com/xenodeve/resume_web',
        description: null,
        ownerLogin: 'xenodeve',
      },
      NOW,
    );
    expect(row.live_url).toBeNull();
  });
  test('falls back to ownerLogin when the url is unparseable', () => {
    const row = memberRepoToProjectInsert(
      { name: 'X', url: 'not-a-url', description: null, ownerLogin: 'akkanop-x' },
      NOW,
    );
    expect(row.gh_owner).toBe('akkanop-x');
    expect(row.gh_repo).toBeNull();
  });
});

describe('availableToImport', () => {
  const repos: MemberRepoInput[] = [
    { name: 'Resume Web', url: 'u1', description: null, ownerLogin: 'a' },
    { name: 'MangaDock', url: 'u2', description: null, ownerLogin: 'a' },
    { name: 'Resume Web', url: 'u3', description: null, ownerLogin: 'b' }, // dup slug
  ];
  test('drops repos whose slug is already a project, and de-dups within the list', () => {
    const out = availableToImport(repos, ['mangadock']); // mangadock already imported
    expect(out.map((r) => r.name)).toEqual(['Resume Web']); // one Resume Web, no MangaDock
  });
  test('returns all when nothing is imported yet', () => {
    expect(availableToImport(repos.slice(0, 2), [])).toHaveLength(2);
  });
});
