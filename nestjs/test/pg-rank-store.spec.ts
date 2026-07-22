import { describe, it, expect } from 'bun:test';
import { PgDialect } from 'drizzle-orm/pg-core';
import { PgRankStore } from '../src/rank/pg-rank.store';
import type { DrizzleDB } from '../src/database/database.module';

// SQL-capture (no live DB) — render the emitted SQL and assert on it (mirrors the
// other Pg*Store specs). #13: the rank job must also cover member content, ranking
// only what's publicly shown (selected repos / published certs).
function fakeDb(result: unknown[] = []) {
  const calls: { text: string; params: unknown[] }[] = [];
  const execute = (q: unknown) => {
    const { sql: text, params } = new PgDialect().sqlToQuery(
      q as Parameters<PgDialect['sqlToQuery']>[0],
    );
    calls.push({ text: text.toLowerCase(), params });
    return Promise.resolve(result);
  };
  const db = {
    execute,
    transaction: (cb: (tx: { execute: typeof execute }) => Promise<unknown>) =>
      cb({ execute }),
  } as unknown as DrizzleDB;
  return { db, calls };
}

describe('PgRankStore — member content kinds (#13)', () => {
  it('getCandidates(member_projects) ranks only the selected (shown) repos', async () => {
    const { db, calls } = fakeDb([]);
    await new PgRankStore(db).getCandidates('member_projects');
    expect(calls[0].text).toContain('from member_projects');
    expect(calls[0].text).toContain('selected = true');
  });

  it('getCandidates(member_certificates) ranks only published certs', async () => {
    const { db, calls } = fakeDb([]);
    await new PgRankStore(db).getCandidates('member_certificates');
    expect(calls[0].text).toContain('from member_certificates');
    expect(calls[0].text).toContain("status = 'published'");
  });

  it('applyRanks writes ai_rank to the member tables by id', async () => {
    const p = fakeDb();
    await new PgRankStore(p.db).applyRanks('member_projects', [
      { id: '1', aiRank: 0, aiRankRationale: 'r' },
    ]);
    expect(p.calls[0].text).toContain('update member_projects');
    expect(p.calls[0].text).toContain('ai_rank =');

    const c = fakeDb();
    await new PgRankStore(c.db).applyRanks('member_certificates', [
      { id: '2', aiRank: 1 },
    ]);
    expect(c.calls[0].text).toContain('update member_certificates');
  });
});
