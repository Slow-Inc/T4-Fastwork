import { describe, it, expect, beforeEach, afterEach } from 'bun:test';
import { UnauthorizedException } from '@nestjs/common';
import { LiveUrlController } from '../src/github/live-url.controller';
import type {
  LiveUrlSnapshotReader,
  LiveUrlStore,
} from '../src/github/live-url-fill';

function make() {
  const applied: { id: number; liveUrl: string }[] = [];
  const store: LiveUrlStore = {
    listPublishedGithubNeedingLiveUrl: async () => [
      {
        id: 1,
        slug: 'resume-web',
        ghOwner: 'xenodeve',
        ghRepo: 'resume_web',
        liveUrl: null,
      },
    ],
    applyLiveUrl: async (id, liveUrl) => {
      applied.push({ id, liveUrl });
    },
  };
  const snapshots: LiveUrlSnapshotReader = {
    readRepoLists: async () => [
      [
        {
          name: 'resume_web',
          owner: { login: 'xenodeve' },
          html_url: 'https://github.com/xenodeve/resume_web',
          homepage: 'resume.example',
          pushed_at: '2026-01-01T00:00:00Z',
        },
      ],
    ],
  };
  return {
    c: new LiveUrlController(store, snapshots),
    applied,
  };
}

describe('LiveUrlController (#157)', () => {
  const prev = process.env.GITHUB_REFRESH_SECRET;
  beforeEach(() => {
    process.env.GITHUB_REFRESH_SECRET = 'right';
  });
  afterEach(() => {
    if (prev === undefined) delete process.env.GITHUB_REFRESH_SECRET;
    else process.env.GITHUB_REFRESH_SECRET = prev;
  });

  it('rejects a wrong secret', async () => {
    const { c } = make();
    await expect(c.run('wrong', {})).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
  });

  it('dry-run plans fills but does not persist', async () => {
    const { c, applied } = make();
    const res = await c.run('right', {});
    expect(res.applied).toBe(false);
    expect(res.filled).toBe(1);
    expect(res.candidates).toBe(1);
    expect(applied).toHaveLength(0);
  });

  it('apply:true persists planned live_url values', async () => {
    const { c, applied } = make();
    const res = await c.run('right', { apply: true });
    expect(res.applied).toBe(true);
    expect(res.filled).toBe(1);
    expect(applied).toEqual([
      { id: 1, liveUrl: 'https://resume.example' },
    ]);
  });
});
