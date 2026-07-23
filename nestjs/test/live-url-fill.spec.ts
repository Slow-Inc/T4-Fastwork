import { describe, it, expect } from 'bun:test';
import {
  buildHomepageIndex,
  planLiveUrlFills,
  type LiveUrlCandidate,
} from '../src/github/live-url-fill';

describe('buildHomepageIndex', () => {
  it('indexes owner/repo → homepage from raw GitHub list JSON arrays', () => {
    const idx = buildHomepageIndex([
      [
        {
          name: 'MangaDock',
          owner: { login: 'Slow-Inc' },
          html_url: 'https://github.com/Slow-Inc/MangaDock',
          homepage: 'mangadock.example',
          pushed_at: '2026-01-01T00:00:00Z',
        },
        {
          name: 'bare',
          owner: { login: 'Slow-Inc' },
          html_url: 'https://github.com/Slow-Inc/bare',
          homepage: null,
          pushed_at: '2026-01-01T00:00:00Z',
        },
      ],
      [
        {
          name: 'resume_web',
          owner: { login: 'xenodeve' },
          html_url: 'https://github.com/xenodeve/resume_web',
          homepage: 'https://resume.example',
          pushed_at: '2026-01-01T00:00:00Z',
        },
      ],
    ]);
    expect(idx.get('slow-inc/mangadock')).toBe('mangadock.example');
    expect(idx.get('slow-inc/bare')).toBeNull();
    expect(idx.get('xenodeve/resume_web')).toBe('https://resume.example');
  });

  it('skips malformed entries without throwing', () => {
    const idx = buildHomepageIndex([[null, { nope: true }, 'x']]);
    expect(idx.size).toBe(0);
  });
});

describe('planLiveUrlFills', () => {
  const candidates: LiveUrlCandidate[] = [
    {
      id: 1,
      slug: 'mangadock',
      ghOwner: 'Slow-Inc',
      ghRepo: 'MangaDock',
      liveUrl: null,
    },
    {
      id: 2,
      slug: 'already',
      ghOwner: 'Slow-Inc',
      ghRepo: 'HasSite',
      liveUrl: 'https://keep.me',
    },
    {
      id: 3,
      slug: 'no-home',
      ghOwner: 'Slow-Inc',
      ghRepo: 'NoSite',
      liveUrl: null,
    },
  ];

  it('fills only null live_url when homepage exists (normalized)', () => {
    const idx = new Map<string, string | null>([
      ['slow-inc/mangadock', 'demo.example.com'],
      ['slow-inc/hassite', 'https://ignored.com'],
      ['slow-inc/nosite', null],
    ]);
    expect(planLiveUrlFills(candidates, idx)).toEqual([
      { id: 1, slug: 'mangadock', liveUrl: 'https://demo.example.com' },
    ]);
  });

  it('respects maxPerRun cap', () => {
    const many: LiveUrlCandidate[] = [
      {
        id: 1,
        slug: 'a',
        ghOwner: 'o',
        ghRepo: 'a',
        liveUrl: null,
      },
      {
        id: 2,
        slug: 'b',
        ghOwner: 'o',
        ghRepo: 'b',
        liveUrl: null,
      },
    ];
    const idx = new Map([
      ['o/a', 'https://a.dev'],
      ['o/b', 'https://b.dev'],
    ]);
    expect(planLiveUrlFills(many, idx, 1)).toEqual([
      { id: 1, slug: 'a', liveUrl: 'https://a.dev' },
    ]);
  });
});
