/**
 * Deploying the code before migrations 0032/0033 must not break paths that work today (#198).
 * The frontend already degrades via PROJECT_SELECT_ATTEMPTS; the backend has to do the same,
 * because a merge auto-deploys while the production write gate keeps the migrations parked.
 */
import { describe, it, expect } from 'bun:test';
import { PgProjectDraftStore } from '../src/github/pg-project-draft-store';
import { PgPipelineSyncStore } from '../src/github/pg-pipeline-sync.store';
import { CurateService, type CurateRepo } from '../src/github/github-curate';

/** Postgres undefined_column, as the driver surfaces it. */
function undefinedColumn(column: string): Error & { code: string } {
  const err = new Error(
    `column "${column}" of relation "projects" does not exist`,
  ) as Error & { code: string };
  err.code = '42703';
  return err;
}

/** Raw text of a drizzle sql`` template, for asserting which columns an attempt used. */
function sqlText(q: unknown): string {
  if (q == null || typeof q !== 'object') return '';
  const node = q as { value?: unknown; queryChunks?: unknown[] };
  if (Array.isArray(node.value)) return node.value.join('');
  if (Array.isArray(node.queryChunks)) {
    // Nested sql``/sql.raw() fragments have to be walked, or a degraded attempt looks
    // identical to the richer one and the ladder is never actually exercised.
    return node.queryChunks.map(sqlText).join(' ');
  }
  return '';
}

/** A db that rejects any statement mentioning `column`, and records every attempt. */
function dbMissing(column: string, rowsForDegraded: unknown[] = []) {
  const attempts: string[] = [];
  const db = {
    execute: (q: unknown) => {
      const text = sqlText(q);
      attempts.push(text);
      if (text.includes(column)) return Promise.reject(undefinedColumn(column));
      return Promise.resolve(rowsForDegraded);
    },
  };
  return { db, attempts };
}

const REPO: CurateRepo = {
  name: 'alpha',
  owner: { login: 'Slow-Inc' },
  html_url: 'https://github.com/Slow-Inc/alpha',
  description: 'a repo',
  fork: false,
  archived: false,
  private: false,
  stargazers_count: 5,
  pushed_at: new Date().toISOString(),
  homepage: 'https://alpha.example',
};

describe('pre-migration tolerance: gh_private missing (#198)', () => {
  it('insertDraft still inserts the row without gh_private', async () => {
    const { db, attempts } = dbMissing('gh_private');
    const store = new PgProjectDraftStore(db as never);

    await store.insertDraft({
      slug: 'alpha',
      title: 'Alpha',
      source: 'github',
      status: 'draft',
      ghOwner: 'Slow-Inc',
      ghRepo: 'alpha',
      ghHtmlUrl: REPO.html_url,
      ghPrivate: false,
      liveUrl: 'https://alpha.example',
      ownerType: 'org',
      ownerLogin: 'Slow-Inc',
      titleOwner: 'auto',
      titleEnOwner: 'auto',
      descriptionOwner: 'auto',
      contentOwner: 'auto',
      categoryOwner: 'auto',
      tagsOwner: 'auto',
      technologiesOwner: 'auto',
    });

    expect(attempts).toHaveLength(2);
    expect(attempts[0]).toContain('gh_private');
    expect(attempts[1]).not.toContain('gh_private');
    expect(attempts[1]).toContain('insert into projects');
  });

  it('the visibility sync degrades to a no-op instead of throwing', async () => {
    const { db } = dbMissing('gh_private');
    const store = new PgProjectDraftStore(db as never);

    await store.syncGhPrivateBatch([
      { owner: 'Slow-Inc', repo: 'alpha', ghPrivate: false },
      { owner: 'Slow-Inc', repo: 'beta', ghPrivate: true },
    ]);
  });

  it('curate completes a full pass when the visibility sync fails', async () => {
    const inserted: string[] = [];
    const svc = new CurateService(
      {
        existsBySlug: () => Promise.resolve(false),
        insertDraft: (row) => {
          inserted.push(row.slug);
          return Promise.resolve();
        },
        syncGhPrivateBatch: () => Promise.reject(undefinedColumn('gh_private')),
      },
      () => new Date(),
    );

    const res = await svc.curate([REPO]);

    expect(res.inserted).toEqual(['alpha']);
    expect(inserted).toEqual(['alpha']);
  });

  it('loadByGithub returns usable state without the new columns', async () => {
    const degradedRow = {
      id: 4,
      slug: 'alpha',
      status: 'published',
      source: 'github',
      gh_owner: 'Slow-Inc',
      gh_repo: 'alpha',
      live_url: 'https://alpha.example',
      snapshot_image: null,
      content: null,
      content_owner: 'auto',
      category_id: null,
      category_owner: 'auto',
      tags_owner: 'auto',
      technologies_owner: 'auto',
      overview_summary: null,
      overview_owner: 'auto',
      readme_sha: 'sha-a',
    };
    const { db, attempts } = dbMissing('gh_private', [degradedRow]);
    const store = new PgPipelineSyncStore(db as never);

    const state = await store.loadByGithub('Slow-Inc', 'alpha');

    expect(state).not.toBeNull();
    expect(state?.slug).toBe('alpha');
    // Unknown visibility keeps the historical default (curate only inserted public repos).
    expect(state?.isPublicRepo).toBe(true);
    expect(state?.lastCaptureTrigger).toBeNull();
    expect(state?.lastCaptureDispatchAt).toBeNull();
    expect(attempts[0]).toContain('gh_private');
    expect(attempts.some((a) => !a.includes('gh_private'))).toBe(true);
  });
});

describe('pre-migration tolerance: last_capture_* missing (#198)', () => {
  // The read ladder was the easy half. This write had no guard at all, so every event lost the
  // cooldown and re-dispatched a capture whose own write then failed silently (#205).
  it('recordCaptureDispatch degrades to a no-op instead of throwing', async () => {
    const { db, attempts } = dbMissing('last_capture_dispatch_at');
    const store = new PgPipelineSyncStore(db as never);

    await store.recordCaptureDispatch(4, '2026-07-25T00:00:00.000Z');

    expect(attempts).toHaveLength(1);
    expect(attempts[0]).toContain('last_capture_dispatch_at');
  });

  // 0034 is parked behind the same production-write gate, so the recorder ships before its
  // columns exist. Throwing here would turn every applied run into a failed one (#193).
  it('recordSyncOutcome degrades to a no-op instead of throwing', async () => {
    const { db, attempts } = dbMissing('last_synced_at');
    const store = new PgPipelineSyncStore(db as never);

    await store.recordSyncOutcome(4, '2026-07-26T00:00:00.000Z', null);

    expect(attempts).toHaveLength(1);
    expect(attempts[0]).toContain('last_synced_at');
  });

  it('loadByGithub degrades when only the capture columns are missing', async () => {
    const { db } = dbMissing('last_capture_trigger', [
      {
        id: 9,
        slug: 'beta',
        status: 'published',
        source: 'github',
        gh_owner: 'Slow-Inc',
        gh_repo: 'beta',
        live_url: null,
        snapshot_image: null,
        content: null,
        content_owner: 'auto',
        category_id: null,
        category_owner: 'auto',
        tags_owner: 'auto',
        technologies_owner: 'auto',
        overview_summary: null,
        overview_owner: 'auto',
        readme_sha: null,
      },
    ]);
    const store = new PgPipelineSyncStore(db as never);

    const state = await store.loadByGithub('Slow-Inc', 'beta');

    expect(state?.slug).toBe('beta');
    expect(state?.lastCaptureTrigger).toBeNull();
  });
});
