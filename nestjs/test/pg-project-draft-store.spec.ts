import { describe, it, expect } from 'bun:test';
import { PgDialect } from 'drizzle-orm/pg-core';
import { PgProjectDraftStore } from '../src/github/pg-project-draft-store';
import type { DrizzleDB } from '../src/database/database.module';
import type { DraftProject } from '../src/github/github-curate';

// No live DB — capture the SQL the store emits and render it with drizzle's dialect
// (mirrors github-generate-store.spec.ts). `result` fakes the rows execute() returns.
function captureStore(result: unknown[] = []) {
  const captured: { text: string; params: unknown[] }[] = [];
  const db = {
    execute: (q: unknown) => {
      const { sql: text, params } = new PgDialect().sqlToQuery(
        q as Parameters<PgDialect['sqlToQuery']>[0],
      );
      captured.push({ text: text.toLowerCase(), params });
      return Promise.resolve(result);
    },
  } as unknown as DrizzleDB;
  return { store: new PgProjectDraftStore(db), captured };
}

const draft: DraftProject = {
  slug: 'newproj',
  title: 'newproj',
  source: 'github',
  status: 'draft',
  ghOwner: 'Slow-Inc',
  ghRepo: 'newproj',
  ghHtmlUrl: 'https://github.com/Slow-Inc/newproj',
  ghPrivate: false,
  liveUrl: 'https://newproj.dev',
  ownerType: 'team',
  ownerLogin: 'Slow-Inc',
  titleOwner: 'auto',
  titleEnOwner: 'auto',
  descriptionOwner: 'auto',
  contentOwner: 'auto',
  categoryOwner: 'auto',
  tagsOwner: 'auto',
  technologiesOwner: 'auto',
};

describe('PgProjectDraftStore.existsBySlug', () => {
  it('is true when a row matches, false when none', async () => {
    const hit = captureStore([{ '?column?': 1 }]);
    expect(await hit.store.existsBySlug('newproj')).toBe(true);
    expect(hit.captured[0].text).toContain('from projects');
    expect(hit.captured[0].text).toContain('where slug =');
    expect(hit.captured[0].params).toContain('newproj');

    const miss = captureStore([]);
    expect(await miss.store.existsBySlug('nope')).toBe(false);
  });
});

describe('PgProjectDraftStore.insertDraft', () => {
  it('inserts a github-sourced draft with live_url and auto provenance', async () => {
    const { store, captured } = captureStore();
    await store.insertDraft(draft);
    expect(captured.length).toBe(1);
    const q = captured[0].text;
    expect(q).toContain('insert into projects');
    for (const col of [
      'slug',
      'source',
      'status',
      'gh_owner',
      'gh_repo',
      'gh_html_url',
      'gh_private',
      'live_url',
      'owner_type',
      'owner_login',
      'title_owner',
      'title_en_owner',
      'description_owner',
      'content_owner',
      'category_owner',
      'tags_owner',
      'technologies_owner',
    ]) {
      expect(q).toContain(col);
    }
    // idempotent — a racing curate run must not error on the unique slug
    expect(q).toContain('on conflict');
    // values flow through as bound params, never interpolated
    for (const v of [
      'newproj',
      'github',
      'draft',
      'https://newproj.dev',
      'auto',
    ]) {
      expect(captured[0].params).toContain(v);
    }
  });
});

describe('PgProjectDraftStore.syncGhPrivateBatch (#194 / #198)', () => {
  it('updates matching github identities in one statement per visibility value', async () => {
    const { store, captured } = captureStore();

    await store.syncGhPrivateBatch([
      { owner: 'Slow-Inc', repo: 'newproj', ghPrivate: true },
      { owner: 'Slow-Inc', repo: 'secondproj', ghPrivate: true },
      { owner: 'Slow-Inc', repo: 'openproj', ghPrivate: false },
    ]);

    // Two statements for three repos — not one per repo per pass.
    expect(captured).toHaveLength(2);
    for (const c of captured) {
      expect(c.text).toContain('update projects');
      expect(c.text).toContain('gh_private');
    }
    expect(captured[0].params).toContain(true);
    expect(captured[0].params).toContain('slow-inc/newproj');
    expect(captured[0].params).toContain('slow-inc/secondproj');
    expect(captured[1].params).toContain(false);
    expect(captured[1].params).toContain('slow-inc/openproj');
  });

  it('does not touch the database for an empty batch', async () => {
    const { store, captured } = captureStore();
    await store.syncGhPrivateBatch([]);
    expect(captured).toHaveLength(0);
  });
});
