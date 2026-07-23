import { describe, it, expect } from 'bun:test';
import { PgDialect } from 'drizzle-orm/pg-core';
import { PgOverviewStore } from '../src/github/pg-overview.store';
import type { DrizzleDB } from '../src/database/database.module';

function captureStore() {
  const captured: { text: string; params: unknown[] }[] = [];
  const execute = (q: unknown) => {
    const { sql: text, params } = new PgDialect().sqlToQuery(
      q as Parameters<PgDialect['sqlToQuery']>[0],
    );
    captured.push({ text: text.toLowerCase(), params });
    return Promise.resolve([]);
  };
  const db = { execute } as unknown as DrizzleDB;
  return { store: new PgOverviewStore(db), captured };
}

describe('PgOverviewStore.applyOverview (#130)', () => {
  it('owner-guards every overview column with overview_owner = auto', async () => {
    const { store, captured } = captureStore();
    await store.applyOverview(7, {
      summary: 'ส',
      highlights: 'ห',
      goodFor: 'ก',
      summaryEn: 'S',
      highlightsEn: 'H',
      goodForEn: 'G',
    });
    expect(captured).toHaveLength(1);
    const q = captured[0].text;
    expect(q).toContain('update projects');
    expect(q).toContain("overview_owner = 'auto'");
    expect(q).toContain('overview_summary');
    expect(q).toContain('overview_highlights');
    expect(q).toContain('overview_good_for');
    expect(q).toContain("source = 'github'");
  });
});
