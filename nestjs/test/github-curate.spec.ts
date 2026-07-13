import { describe, it, expect } from 'bun:test';
import {
  isEligibleRepo,
  deriveOwnerType,
  repoToDraftProject,
  CurateService,
  type CurateRepo,
  type ProjectDraftStore,
} from '../src/github/github-curate.ts';

const NOW = new Date('2026-07-14T00:00:00Z');

function repo(over: Partial<CurateRepo> = {}): CurateRepo {
  return {
    name: 'mangadock',
    owner: { login: 'Slow-Inc' },
    html_url: 'https://github.com/Slow-Inc/mangadock',
    description: 'AI manga translation',
    fork: false,
    archived: false,
    private: false,
    stargazers_count: 3,
    pushed_at: '2026-06-01T00:00:00Z',
    topics: ['ai', 'ocr'],
    ...over,
  };
}

describe('isEligibleRepo', () => {
  it('accepts a public, active, described repo', () => {
    expect(isEligibleRepo(repo(), NOW)).toBe(true);
  });

  it('rejects private, fork, or archived repos', () => {
    expect(isEligibleRepo(repo({ private: true }), NOW)).toBe(false);
    expect(isEligibleRepo(repo({ fork: true }), NOW)).toBe(false);
    expect(isEligibleRepo(repo({ archived: true }), NOW)).toBe(false);
  });

  it('rejects junk names, dotfiles, and the profile repo', () => {
    expect(isEligibleRepo(repo({ name: 'test' }), NOW)).toBe(false);
    expect(isEligibleRepo(repo({ name: 'scratch' }), NOW)).toBe(false);
    expect(isEligibleRepo(repo({ name: '.github' }), NOW)).toBe(false);
    // profile repo: name === owner login
    expect(
      isEligibleRepo(
        repo({ name: 'xenodeve', owner: { login: 'xenodeve' } }),
        NOW,
      ),
    ).toBe(false);
  });

  it('rejects an empty repo (no description, stars, or topics)', () => {
    expect(
      isEligibleRepo(
        repo({ description: null, stargazers_count: 0, topics: [] }),
        NOW,
      ),
    ).toBe(false);
  });

  it('rejects a repo not pushed within 18 months', () => {
    expect(
      isEligibleRepo(repo({ pushed_at: '2024-01-01T00:00:00Z' }), NOW),
    ).toBe(false);
  });
});

describe('deriveOwnerType', () => {
  it('is team for the org, personal otherwise', () => {
    expect(deriveOwnerType('Slow-Inc')).toBe('team');
    expect(deriveOwnerType('xenodeve')).toBe('personal');
  });
});

describe('repoToDraftProject', () => {
  it('maps a repo to a github-sourced draft with all fields auto-owned', () => {
    const d = repoToDraftProject(repo());
    expect(d.slug).toBe('mangadock');
    expect(d.source).toBe('github');
    expect(d.status).toBe('draft');
    expect(d.ghOwner).toBe('Slow-Inc');
    expect(d.ghRepo).toBe('mangadock');
    expect(d.ownerType).toBe('team');
    expect(d.ownerLogin).toBe('Slow-Inc');
    expect(d.titleOwner).toBe('auto');
    expect(d.descriptionOwner).toBe('auto');
    expect(d.technologiesOwner).toBe('auto');
  });

  it('slugifies a personal repo name and marks owner_type personal', () => {
    const d = repoToDraftProject(
      repo({ name: 'My Cool App', owner: { login: 'xenodeve' } }),
    );
    expect(d.slug).toBe('my-cool-app');
    expect(d.ownerType).toBe('personal');
  });
});

describe('CurateService.curate', () => {
  function fakeStore(existing: string[] = []) {
    const seen = new Set(existing);
    const inserted: { slug: string }[] = [];
    const store: ProjectDraftStore = {
      existsBySlug: async (slug) => seen.has(slug),
      insertDraft: async (row) => {
        inserted.push(row);
        seen.add(row.slug);
      },
    };
    return { store, inserted };
  }

  it('inserts drafts only for eligible, not-yet-tracked repos', async () => {
    const { store, inserted } = fakeStore(['mangadock']); // already tracked
    const svc = new CurateService(store, () => NOW);

    const r = await svc.curate([
      repo({ name: 'mangadock' }), // eligible but already tracked → skip
      repo({ name: 'newproj', html_url: 'https://github.com/Slow-Inc/newproj' }),
      repo({ name: 'test' }), // ineligible → skip
    ]);

    expect(r.inserted).toEqual(['newproj']);
    expect(inserted.map((i) => i.slug)).toEqual(['newproj']);
  });
});
