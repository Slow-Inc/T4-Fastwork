import { describe, it, expect } from 'bun:test';
import { PgDialect } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';
import { sqlTextArray } from '../src/github/sql-text-array';

describe('sqlTextArray (#126)', () => {
  it('renders as array[$n,...]::text[] with one param per element', () => {
    const { sql: text, params } = new PgDialect().sqlToQuery(
      sql`insert into t (tags) values (${sqlTextArray(['a', 'b', 'c'])})`,
    );
    expect(text.toLowerCase()).toContain('array[');
    expect(text.toLowerCase()).toContain(']::text[]');
    // Must NOT expand to a bare row/tuple in the VALUES list without array[].
    expect(text.toLowerCase()).not.toMatch(/values\s*\(\s*\$\d+\s*,\s*\$\d+\s*,\s*\$\d+\s*\)/);
    expect(params).toEqual(['a', 'b', 'c']);
  });

  it('renders an empty array constructor', () => {
    const { sql: text, params } = new PgDialect().sqlToQuery(
      sql`select ${sqlTextArray([])}`,
    );
    expect(text.toLowerCase()).toContain('array[]::text[]');
    expect(params).toEqual([]);
  });
});
