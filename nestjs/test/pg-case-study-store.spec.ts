import { describe, it, expect } from 'bun:test';
import { PgDialect } from 'drizzle-orm/pg-core';
import { PgCaseStudyStore } from '../src/github/pg-case-study.store';
import type { DrizzleDB } from '../src/database/database.module';
import type { CaseStudy, FileExtract } from '../src/github/github-case-study';

// No live DB, so we capture + render the emitted SQL (drizzle PgDialect) and, for
// reads, feed the store fake rows through a mock `execute`.
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
    // Run the callback with a tx that captures the same way (atomic writes).
    transaction: (cb: (tx: { execute: typeof execute }) => Promise<unknown>) =>
      cb({ execute }),
  } as unknown as DrizzleDB;
  return { db, calls };
}

const extract = (path: string, blobSha: string): FileExtract => ({
  path,
  blobSha,
  themes: ['t'],
  architecture: 'a',
  tech: ['x'],
  userOutcomes: 'o',
  codeDepth: 'd',
});

describe('PgCaseStudyStore (#81 P2 persistence)', () => {
  it('readManifest maps rows → docs, and only rows with an extract → cachedExtracts', async () => {
    const { db } = fakeDb([
      { path: 'README.md', blob_sha: 'aaa', markdown: '# hi', extract: null },
      {
        path: 'docs/a.md',
        blob_sha: 'bbb',
        markdown: 'x',
        extract: extract('docs/a.md', 'bbb'),
      },
    ]);
    const { docs, cachedExtracts } = await new PgCaseStudyStore(
      db,
    ).readManifest(7);
    expect(docs.map((d) => d.path)).toEqual(['README.md', 'docs/a.md']);
    expect(docs[0]).toEqual({
      path: 'README.md',
      blobSha: 'aaa',
      markdown: '# hi',
    });
    expect(cachedExtracts).toHaveLength(1);
    expect(cachedExtracts[0].blobSha).toBe('bbb');
  });

  it('readManifest drops a malformed cached extract (so the file is re-mapped)', async () => {
    const { db } = fakeDb([
      { path: 'a.md', blob_sha: 'x', markdown: 'm', extract: { blobSha: 'x' } },
    ]);
    const { docs, cachedExtracts } = await new PgCaseStudyStore(
      db,
    ).readManifest(1);
    expect(docs).toHaveLength(1);
    expect(cachedExtracts).toHaveLength(0);
  });

  it('readManifest excludes deleted rows', async () => {
    const { db, calls } = fakeDb([]);
    await new PgCaseStudyStore(db).readManifest(7);
    expect(calls[0].text).toContain('from project_documents');
    expect(calls[0].text).toContain('deleted_at is null');
  });

  it('saveExtracts writes one jsonb update per extract, keyed by path', async () => {
    const { db, calls } = fakeDb();
    await new PgCaseStudyStore(db).saveExtracts(7, [
      extract('README.md', 'aaa'),
      extract('docs/a.md', 'bbb'),
    ]);
    expect(calls).toHaveLength(2);
    expect(calls[0].text).toContain('update project_documents');
    expect(calls[0].text).toContain('set extract =');
    expect(calls[0].text).toContain('::jsonb');
    expect(calls[0].text).toContain('and path =');
  });

  it('upsertCaseStudies inserts case_study/github/auto drafts, owner-guarded on conflict', async () => {
    const { db, calls } = fakeDb();
    const study: CaseStudy = {
      audience: 'business',
      title: 'T',
      titleEn: 'TE',
      description: 'D',
      content: 'C',
      tags: ['a'],
      technologies: ['x'],
    };
    await new PgCaseStudyStore(db).upsertCaseStudies(7, 'mangadock', [study]);
    const q = calls[0].text;
    expect(q).toContain('insert into blog_posts');
    expect(q).toContain(
      "on conflict (project_id, audience) where kind = 'case_study'",
    );
    // only rewrite a row still owned by auto
    expect(q).toContain("case when blog_posts.owner = 'auto'");
    // slug derived from project + audience, and the fixed case-study markers
    expect(calls[0].params).toContain('mangadock-business');
    expect(q).toContain("'case_study'");
    expect(q).toContain("'github'");
    expect(q).toContain("'auto'");
  });

  it('isJobDone returns true only when a done row exists', async () => {
    const done = fakeDb([{ '?column?': 1 }]);
    expect(await new PgCaseStudyStore(done.db).isJobDone(7, 'h', 'v1')).toBe(
      true,
    );
    expect(done.calls[0].text).toContain("status = 'done'");
    const none = fakeDb([]);
    expect(await new PgCaseStudyStore(none.db).isJobDone(7, 'h', 'v1')).toBe(
      false,
    );
  });

  it('recordJob upserts on the (project, hash, version) unique key', async () => {
    const { db, calls } = fakeDb();
    await new PgCaseStudyStore(db).recordJob(7, 'h', 'v1', 'done');
    const q = calls[0].text;
    expect(q).toContain('insert into generation_jobs');
    expect(q).toContain(
      'on conflict (project_id, input_manifest_hash, prompt_version)',
    );
    expect(q).toContain('attempts = generation_jobs.attempts + 1');
  });
});
