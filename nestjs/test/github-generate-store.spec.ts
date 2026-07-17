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
  const db = {
    execute: (q: unknown) => {
      const { sql: text, params } = new PgDialect().sqlToQuery(
        q as Parameters<PgDialect['sqlToQuery']>[0],
      );
      captured.push({ text: text.toLowerCase(), params });
      return Promise.resolve([]);
    },
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
