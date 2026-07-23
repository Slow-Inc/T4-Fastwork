import { describe, it, expect } from 'bun:test';
import { PgDialect } from 'drizzle-orm/pg-core';
import { PgCaseStudySimpleStore } from '../src/github/pg-case-study-simple.store';
import type { DrizzleDB } from '../src/database/database.module';
import type { GeneratedContent } from '../src/github/github-generate';

// No live DB — capture + render the emitted SQL (drizzle PgDialect); for reads,
// feed fake rows through a mock `execute` (mirrors pg-case-study-store.spec).
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

const gen: GeneratedContent = {
  title: 'ชื่อ',
  titleEn: 'T',
  description: 'ย่อ',
  content: 'ก\n\nข',
  category: 'web',
  tags: ['x', 'y', 'z'],
  technologies: ['ts'],
};

describe('PgCaseStudySimpleStore', () => {
  it('publishCaseStudy upserts the business case_study post + mirrors projects.content in one txn', async () => {
    const { db, calls } = fakeDb();
    await new PgCaseStudySimpleStore(db).publishCaseStudy(7, 'proj', gen, 'sha9');

    expect(calls).toHaveLength(2); // two writes, one transaction

    const blog = calls[0].text;
    expect(blog).toContain('insert into blog_posts');
    expect(blog).toContain("'business'");
    expect(blog).toContain("'case_study'");
    expect(blog).toContain("owner = 'auto'"); // owner-guard in the conflict update
    // published_at is owner-guarded too — a human draft (published_at null, owner
    // 'human') must NOT be silently re-published by regeneration.
    expect(blog).toContain('coalesce'); // published_at kept once set (auto rows)
    expect(blog).toMatch(
      /published_at = case when blog_posts\.owner = 'auto'\s+then coalesce\(blog_posts\.published_at, now\(\)\)\s+else blog_posts\.published_at end/,
    );
    expect(calls[0].params).toContain('proj-case-study');
    expect(calls[0].params).toContain('ชื่อ');
    // tags MUST be an explicit array constructor, not a bare `${array}` (which
    // drizzle expands into a row/tuple `($5,$6,$7)` in the tags column position —
    // that broke the INSERT on prod). Elements stay parameterized (injection-safe).
    expect(blog).toContain('array[');
    expect(blog).toContain('::text[]');
    expect(calls[0].params).toContain('x');
    expect(calls[0].params).toContain('z'); // all elements bound as params

    const proj = calls[1].text;
    expect(proj).toContain('update projects');
    expect(proj).toContain("content_owner = 'auto'"); // owner-guarded mirror
    expect(proj).toContain('readme_sha');
    expect(proj).toContain("source = 'github'");
    expect(calls[1].params).toContain('sha9');
  });

  it('listPublishedGithubProjects selects only published github rows with gh linkage', async () => {
    const { db, calls } = fakeDb([
      {
        id: 3,
        slug: 's',
        gh_owner: 'o',
        gh_repo: 'r',
        readme_sha: null,
        description: 'd',
      },
    ]);
    const rows = await new PgCaseStudySimpleStore(
      db,
    ).listPublishedGithubProjects();

    expect(rows).toEqual([
      { id: 3, slug: 's', ghOwner: 'o', ghRepo: 'r', readmeSha: null, description: 'd' },
    ]);
    const q = calls[0].text;
    expect(q).toContain("source = 'github'");
    expect(q).toContain("status = 'published'");
    expect(q).toContain('published_at is not null');
    expect(q).toContain('gh_owner is not null');
  });
});
