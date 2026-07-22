import { describe, it, expect } from 'bun:test';
import { PgDialect } from 'drizzle-orm/pg-core';
import { PgGenerateStore } from '../src/github/pg-generate.store';
import type { DrizzleDB } from '../src/database/database.module';

// PgGenerateStore.applyPatch has no observable seam without a live DB, so we
// capture the SQL it emits and render it with drizzle's dialect. The correctness
// requirement (#75 part 2) is that each generated copy field is only written when
// that field is still AUTO-owned — a concurrent human edit (owner flipped to
// 'human' mid-generation) must not be clobbered by the stale patch.
function captureStore() {
  const captured: { text: string; params: unknown[] }[] = [];
  const execute = (q: unknown) => {
    const { sql: text, params } = new PgDialect().sqlToQuery(
      q as Parameters<PgDialect['sqlToQuery']>[0],
    );
    captured.push({ text: text.toLowerCase(), params });
    return Promise.resolve([]);
  };
  const db = {
    execute,
    // applyPatch wraps the copy UPDATE + the taxonomy M2M writes in one transaction;
    // the mock runs the callback with a tx that captures the same way (atomic).
    transaction: (cb: (tx: { execute: typeof execute }) => Promise<unknown>) =>
      cb({ execute }),
  } as unknown as DrizzleDB;
  return { store: new PgGenerateStore(db), captured };
}

describe('PgGenerateStore.applyPatch — only overwrites AUTO-owned fields (#75 part 2)', () => {
  it('guards every copy field with its *_owner = auto predicate', async () => {
    const { store, captured } = captureStore();
    await store.applyPatch('mangadock', {
      title: 'T',
      titleEn: 'TE',
      description: 'D',
      content: 'C',
      readmeSha: 'sha1',
    });
    expect(captured.length).toBe(1);
    const q = captured[0].text;
    expect(q).toContain('case when');
    for (const owner of [
      "title_owner = 'auto'",
      "title_en_owner = 'auto'",
      "description_owner = 'auto'",
      "content_owner = 'auto'",
    ]) {
      expect(q).toContain(owner);
    }
    // still scoped to github-sourced rows
    expect(q).toContain("source = 'github'");
    // bookkeeping columns update unconditionally (not human-ownable)
    expect(q).toContain('readme_sha =');
    expect(q).toContain('generated_at =');
  });

  it('omits a field entirely when the patch does not include it', async () => {
    const { store, captured } = captureStore();
    await store.applyPatch('mangadock', { title: 'T', readmeSha: null });
    const q = captured[0].text;
    expect(q).toContain("title_owner = 'auto'");
    expect(q).not.toContain('title_en =');
    expect(q).not.toContain('content =');
  });
});

describe('PgGenerateStore.applyPatch — persists generated taxonomy (#12)', () => {
  it('resolves category_id (owner-guarded) and replaces the tag/technology M2M', async () => {
    const { store, captured } = captureStore();
    await store.applyPatch('mangadock', {
      category: 'AI Product',
      tags: ['AI', 'OCR'],
      technologies: ['Next.js'],
      readmeSha: 's',
    });
    const all = captured.map((c) => c.text).join('\n');
    // category_id resolved from the EXISTING taxonomy, guarded by category_owner='auto'
    expect(all).toContain('category_id = case when category_owner');
    expect(all).toContain('from public.categories');
    // tag/technology M2M links replaced (delete-then-insert from existing taxonomy)
    expect(all).toContain('delete from project_tags');
    expect(all).toContain('insert into project_tags');
    expect(all).toContain('public.tags');
    expect(all).toContain('delete from project_technologies');
    expect(all).toContain('insert into project_technologies');
    expect(all).toContain('public.technologies');
    // never rewrites a human-owned field's M2M
    expect(all).toContain("tags_owner = 'auto'");
    expect(all).toContain("technologies_owner = 'auto'");
  });

  it('omits all M2M writes when tags/technologies are not in the patch', async () => {
    const { store, captured } = captureStore();
    await store.applyPatch('mangadock', { title: 'T' });
    const all = captured.map((c) => c.text).join('\n');
    expect(all).not.toContain('project_tags');
    expect(all).not.toContain('project_technologies');
  });

  it('deletes stale M2M but inserts none when the patch list is empty', async () => {
    const { store, captured } = captureStore();
    await store.applyPatch('mangadock', { tags: [], technologies: [] });
    const all = captured.map((c) => c.text).join('\n');
    expect(all).toContain('delete from project_tags');
    expect(all).toContain('delete from project_technologies');
    expect(all).not.toContain('insert into project_tags');
    expect(all).not.toContain('insert into project_technologies');
  });
});
