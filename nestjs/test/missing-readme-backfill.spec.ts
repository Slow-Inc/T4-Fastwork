import { describe, it, expect } from 'bun:test';
import {
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
