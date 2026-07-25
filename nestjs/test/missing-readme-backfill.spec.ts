import { describe, it, expect } from 'bun:test';
import {
  authoritativeReadmeKeys,
  README_MARKER_TTL_MS,
  readmeSnapshotKey,
  selectReposMissingReadme,
  type ReadmeBackfillCandidate,
} from '../src/github/missing-readme-backfill';

describe('readmeSnapshotKey', () => {
  it('matches snapshotKey.repoReadme shape', () => {
    expect(readmeSnapshotKey('Slow-Inc', 'MangaDock')).toBe(
      'repo:Slow-Inc/MangaDock:readme',
    );
  });
});

describe('selectReposMissingReadme', () => {
  const candidates: ReadmeBackfillCandidate[] = [
    { owner: 'Slow-Inc', repo: 'MangaDock', slug: 'mangadock' },
    { owner: 'xenodeve', repo: 'resume_web', slug: 'resume-web' },
    { owner: 'Slow-Inc', repo: 'Other', slug: 'other' },
  ];

  it('keeps only repos whose readme snapshot key is absent', () => {
    const existing = new Set([
      'repo:Slow-Inc/MangaDock:readme',
      'repo:someone/else:readme',
    ]);
    expect(selectReposMissingReadme(candidates, existing)).toEqual([
      { owner: 'xenodeve', repo: 'resume_web', slug: 'resume-web' },
      { owner: 'Slow-Inc', repo: 'Other', slug: 'other' },
    ]);
  });

  it('compares keys case-insensitively', () => {
    const existing = new Set(['repo:slow-inc/mangadock:readme']);
    expect(
      selectReposMissingReadme(candidates.slice(0, 1), existing),
    ).toEqual([]);
  });

  it('respects maxPerRun and preserves candidate order', () => {
    const existing = new Set<string>();
    expect(selectReposMissingReadme(candidates, existing, 1)).toEqual([
      { owner: 'Slow-Inc', repo: 'MangaDock', slug: 'mangadock' },
    ]);
    expect(selectReposMissingReadme(candidates, existing, 2)).toEqual([
      { owner: 'Slow-Inc', repo: 'MangaDock', slug: 'mangadock' },
      { owner: 'xenodeve', repo: 'resume_web', slug: 'resume-web' },
    ]);
  });

  it('returns empty for empty candidates', () => {
    expect(selectReposMissingReadme([], new Set())).toEqual([]);
  });
});

/**
 * Which readme snapshots still answer "this repo has been checked" (#215).
 *
 * #177 writes a `{missing: true}` marker when GitHub 404s the README, so the backfill queue can
 * advance past a repo that has none. The marker is a readme key like any other, so it also excluded
 * that repo from the backfill *forever* — and a repo that later gains a README lost the one step
 * built to fetch it, falling back to the broad refresh's rotating 8-repo budget.
 */
describe('authoritativeReadmeKeys (#215)', () => {
  const KEY = 'repo:Slow-Inc/T4-Fastwork:readme';
  const now = new Date('2026-07-26T00:00:00Z');
  const ago = (ms: number) => new Date(now.getTime() - ms);
  const real = { key: KEY, missing: false, checkedAt: null };
  const marker = (age: number) => ({
    key: KEY,
    missing: true,
    checkedAt: ago(age),
  });

  it('a real README snapshot is authoritative regardless of age', () => {
    expect([...authoritativeReadmeKeys([real], now)]).toEqual([KEY]);
  });

  it('a fresh marker is authoritative, so a repo with no README is not re-fetched every run', () => {
    expect(authoritativeReadmeKeys([marker(60_000)], now).has(KEY)).toBe(true);
  });

  it('a marker older than the TTL is not authoritative, so the repo re-enters the backfill', () => {
    expect(
      authoritativeReadmeKeys([marker(README_MARKER_TTL_MS + 1)], now).has(KEY),
    ).toBe(false);
  });

  it('exactly at the TTL is still authoritative — only older expires, so the boundary is not ambiguous', () => {
    expect(
      authoritativeReadmeKeys([marker(README_MARKER_TTL_MS)], now).has(KEY),
    ).toBe(true);
  });

  it('a marker with no readable timestamp is treated as stale rather than trusted forever', () => {
    // A marker written before this change, or one hand-edited, has no usable `checkedAt`. Trusting
    // it would reproduce the permanent exclusion #215 exists to remove, and re-checking costs one
    // API call, so the safe default is to re-check.
    expect(
      authoritativeReadmeKeys(
        [{ key: KEY, missing: true, checkedAt: null }],
        now,
      ).has(KEY),
    ).toBe(false);
  });

  it('feeds selectReposMissingReadme — a stale marker puts the repo back in the queue', () => {
    const candidates: ReadmeBackfillCandidate[] = [
      { owner: 'Slow-Inc', repo: 'T4-Fastwork', slug: 't4-fastwork' },
    ];
    expect(
      selectReposMissingReadme(
        candidates,
        authoritativeReadmeKeys([marker(README_MARKER_TTL_MS + 1)], now),
      ),
    ).toEqual(candidates);
    expect(
      selectReposMissingReadme(
        candidates,
        authoritativeReadmeKeys([marker(1_000)], now),
      ),
    ).toEqual([]);
  });
});
