/**
 * Detecting a published project row whose auto-filled fields never got filled (#222).
 *
 * This is the check the sync-health predicates (#193) cannot make. A webhook defers the LLM actions
 * on every run and deferral is not a failure, so #211 — a published github row with no category and
 * no content, serving an empty page — records a clean run and reads healthy through
 * `isSyncUnhealthy`. The invariant here reads the row itself, so an empty shell cannot hide behind a
 * successful run.
 */
import { describe, it, expect } from 'bun:test';
import { PgDialect } from 'drizzle-orm/pg-core';
import type { DrizzleDB } from '../src/database/database.module';
import { PgShowcaseRepoStore } from '../src/github/pg-showcase-repos.store';
import {
  incompleteProject,
  incompleteProjects,
  resolveReadmeMissing,
  type ProjectCompleteness,
} from '../src/github/project-completeness';

/** A fully-enriched published github row: nothing to report. */
function complete(
  over: Partial<ProjectCompleteness> = {},
): ProjectCompleteness {
  return {
    slug: 'hype-macro-store',
    status: 'published',
    source: 'github',
    categoryId: 3,
    categoryOwner: 'auto',
    content: 'a case study',
    contentOwner: 'auto',
    overviewSummary: 'a summary',
    overviewOwner: 'auto',
    readmeMissing: false,
    ...over,
  };
}

describe('incompleteProject (#222)', () => {
  it('reports nothing for a fully enriched row', () => {
    expect(incompleteProject(complete())).toBeNull();
  });

  it('reports the #211 shape: published, github-backed, no category and no content', () => {
    const res = incompleteProject(
      complete({ slug: 't4-fastwork', categoryId: null, content: null }),
    );

    expect(res).toEqual({
      slug: 't4-fastwork',
      missing: ['category', 'content'],
      reason: 'never-reached',
    });
  });

  it('separates "GitHub has no README" from "the generator never reached it"', () => {
    // #215's negative cache marks a repo with no README. Those rows cannot be filled by the
    // generators at all (`taxonomy-generate.ts:97`), so reporting them as a stalled queue would
    // send someone looking for a bug that is really a missing upstream file.
    const res = incompleteProject(
      complete({ categoryId: null, content: null, readmeMissing: true }),
    );

    expect(res?.reason).toBe('no-readme');
    expect(res?.missing).toEqual(['category', 'content']);
  });

  it('treats an empty-but-human-owned field as a human decision, not a defect', () => {
    // An editor who deliberately cleared the overview owns it. Reporting that would train
    // everyone to ignore the report — the same reason `stuck` needs three missed revisits (#193).
    expect(
      incompleteProject(
        complete({ overviewSummary: null, overviewOwner: 'human' }),
      ),
    ).toBeNull();
  });

  it('counts whitespace-only content as empty, the way the planner does', () => {
    // `shouldRegenCaseStudy` uses `content.trim() === ''` (`project-automation-sync.ts:126`);
    // disagreeing would report a row the pipeline considers filled, or hide one it will refill.
    expect(
      incompleteProject(complete({ content: '   \n  ' }))?.missing,
    ).toEqual(['content']);
  });

  it('ignores a row no visitor can reach', () => {
    // A draft or hidden row being incomplete is the normal state before enrichment finishes; the
    // defect this catches is an *published* page serving an empty shell.
    expect(
      incompleteProject(complete({ status: 'draft', content: null })),
    ).toBeNull();
    expect(
      incompleteProject(complete({ status: 'hidden', content: null })),
    ).toBeNull();
  });

  it('ignores a CMS row, which no generator is responsible for', () => {
    expect(
      incompleteProject(
        complete({ source: 'cms', categoryId: null, content: null }),
      ),
    ).toBeNull();
  });

  it('reports a missing overview on its own', () => {
    expect(
      incompleteProject(complete({ overviewSummary: '' }))?.missing,
    ).toEqual(['overview']);
  });
});

describe('resolveReadmeMissing (#222)', () => {
  const row = {
    slug: 't4-fastwork',
    ghOwner: 'Slow-Inc',
    ghRepo: 'T4-Fastwork',
    status: 'published' as const,
    source: 'github' as const,
    categoryId: null,
    categoryOwner: 'auto' as const,
    content: null,
    contentOwner: 'auto' as const,
    overviewSummary: null,
    overviewOwner: 'auto' as const,
  };

  it('marks a row whose snapshot is the missing-README marker', () => {
    const [res] = resolveReadmeMissing(
      [row],
      [
        {
          key: 'repo:Slow-Inc/T4-Fastwork:readme',
          missing: true,
          checkedAt: new Date('2026-07-25T15:56:56Z'),
        },
      ],
    );

    expect(res.readmeMissing).toBe(true);
  });

  it('matches the snapshot key case-insensitively', () => {
    // The key is built from whatever casing GitHub returned; `projects.gh_repo` is stored from the
    // same source but a case mismatch would silently report "never reached" for a repo that simply
    // has no README — the wrong person goes looking for the wrong bug.
    const [res] = resolveReadmeMissing(
      [row],
      [
        {
          key: 'repo:slow-inc/t4-fastwork:readme',
          missing: true,
          checkedAt: new Date('2026-07-25T15:56:56Z'),
        },
      ],
    );

    expect(res.readmeMissing).toBe(true);
  });

  it('treats a real README snapshot, and an absent one, as not missing', () => {
    const real = resolveReadmeMissing(
      [row],
      [
        {
          key: 'repo:Slow-Inc/T4-Fastwork:readme',
          missing: false,
          checkedAt: null,
        },
      ],
    );
    expect(real[0].readmeMissing).toBe(false);
    // No snapshot at all means the detail sync has not run yet — unknown, not "no README".
    expect(resolveReadmeMissing([row], [])[0].readmeMissing).toBe(false);
  });
});

describe('PgShowcaseRepoStore.listPublishedGithubForCompleteness (#222)', () => {
  it('selects the owner columns too, so a human-owned blank is not reported', async () => {
    const calls: { text: string }[] = [];
    const db = {
      execute: (q: unknown) => {
        const { sql: text } = new PgDialect().sqlToQuery(
          q as Parameters<PgDialect['sqlToQuery']>[0],
        );
        calls.push({ text: text.toLowerCase() });
        return Promise.resolve([
          {
            slug: 'demo',
            gh_owner: 'Slow-Inc',
            gh_repo: 'Demo',
            status: 'published',
            source: 'github',
            category_id: null,
            category_owner: 'auto',
            content: null,
            content_owner: 'human',
            overview_summary: 'x',
            overview_owner: 'auto',
          },
        ]);
      },
    } as unknown as DrizzleDB;

    const rows = await new PgShowcaseRepoStore(
      db,
    ).listPublishedGithubForCompleteness();

    for (const col of [
      'category_owner',
      'content_owner',
      'overview_owner',
      'gh_owner',
      'gh_repo',
    ]) {
      expect(calls[0].text).toContain(col);
    }
    expect(rows[0]).toEqual({
      slug: 'demo',
      ghOwner: 'Slow-Inc',
      ghRepo: 'Demo',
      status: 'published',
      source: 'github',
      categoryId: null,
      categoryOwner: 'auto',
      content: null,
      contentOwner: 'human',
      overviewSummary: 'x',
      overviewOwner: 'auto',
    });
    // The human-owned blank must survive the mapping, or the predicate cannot exclude it.
    expect(incompleteProject({ ...rows[0], readmeMissing: false })).toEqual({
      slug: 'demo',
      missing: ['category'],
      reason: 'never-reached',
    });
  });
});

describe('incompleteProjects (#222)', () => {
  it('reports only the incomplete rows, in input order', () => {
    const res = incompleteProjects([
      complete({ slug: 'fine' }),
      complete({ slug: 'empty', categoryId: null }),
      complete({ slug: 'also-fine' }),
      complete({ slug: 'no-readme', content: null, readmeMissing: true }),
    ]);

    expect(res.map((r) => `${r.slug}:${r.reason}`)).toEqual([
      'empty:never-reached',
      'no-readme:no-readme',
    ]);
  });

  it('returns nothing when every published row is enriched', () => {
    expect(incompleteProjects([complete(), complete()])).toEqual([]);
  });
});
