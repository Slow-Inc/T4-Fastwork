/**
 * The scheduled report that makes an empty published page findable without a visitor (#222).
 *
 * The endpoint exists so the check runs on the cron rather than on someone remembering to look —
 * that is the North Star corollary: a step that needs a human is a defect to design out.
 */
import { describe, it, expect, beforeEach, afterEach } from 'bun:test';
import { UnauthorizedException } from '@nestjs/common';
import { GithubWriteController } from '../src/github/github-write.controller';
import type { CompletenessRow } from '../src/github/project-completeness';
import type { ReadmeSnapshotState } from '../src/github/missing-readme-backfill';

function row(over: Partial<CompletenessRow> = {}): CompletenessRow {
  return {
    slug: 'demo',
    ghOwner: 'Slow-Inc',
    ghRepo: 'Demo',
    status: 'published',
    source: 'github',
    categoryId: 3,
    categoryOwner: 'auto',
    content: 'filled',
    contentOwner: 'auto',
    overviewSummary: 'a summary',
    overviewOwner: 'auto',
    ...over,
  };
}

function makeController(
  rows: CompletenessRow[],
  states: ReadmeSnapshotState[] = [],
): GithubWriteController {
  const projects = {
    listPublishedGithubForCompleteness: async () => rows,
    listReadmeSnapshotStates: async () => states,
  };
  return new GithubWriteController(
    undefined as never,
    undefined as never,
    undefined as never,
    undefined as never,
    undefined as never,
    undefined as never,
    projects as never,
  );
}

describe('POST /github/report-incomplete (#222)', () => {
  const prev = process.env.GITHUB_REFRESH_SECRET;
  beforeEach(() => {
    process.env.GITHUB_REFRESH_SECRET = 'topsecret';
  });
  afterEach(() => {
    if (prev === undefined) delete process.env.GITHUB_REFRESH_SECRET;
    else process.env.GITHUB_REFRESH_SECRET = prev;
  });

  it('rejects a wrong secret', async () => {
    const c = makeController([row()]);
    await expect(c.doReportIncomplete('nope')).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
  });

  it('reports an empty published page and names what it is missing', async () => {
    const c = makeController([
      row({ slug: 'fine' }),
      row({ slug: 't4-fastwork', categoryId: null, content: null }),
    ]);

    const res = await c.doReportIncomplete('topsecret');

    expect(res.scanned).toBe(2);
    expect(res.incomplete).toEqual([
      {
        slug: 't4-fastwork',
        missing: ['category', 'content'],
        reason: 'never-reached',
      },
    ]);
  });

  it('separates a repo with no README from a stalled generator', async () => {
    const c = makeController(
      [row({ slug: 'no-readme', content: null })],
      [
        {
          key: 'repo:Slow-Inc/Demo:readme',
          missing: true,
          checkedAt: new Date('2026-07-25T15:56:56Z'),
        },
      ],
    );

    const res = await c.doReportIncomplete('topsecret');

    expect(res.incomplete[0].reason).toBe('no-readme');
    // The actionable count excludes it: nothing in this codebase can fill that row.
    expect(res.actionable).toBe(0);
  });

  it('a fully enriched showcase reports nothing, so a quiet run stays quiet', async () => {
    const res = await makeController([row(), row()]).doReportIncomplete(
      'topsecret',
    );

    expect(res.incomplete).toEqual([]);
    expect(res.actionable).toBe(0);
  });

  it('counts only actionable rows as actionable', async () => {
    const res = await makeController(
      [
        row({ slug: 'a', categoryId: null }),
        row({ slug: 'b', content: null, ghRepo: 'NoReadme' }),
      ],
      [
        {
          key: 'repo:Slow-Inc/NoReadme:readme',
          missing: true,
          checkedAt: new Date('2026-07-25T15:56:56Z'),
        },
      ],
    ).doReportIncomplete('topsecret');

    expect(res.actionable).toBe(1);
    expect(res.incomplete.map((i) => i.slug)).toEqual(['a', 'b']);
  });
});
