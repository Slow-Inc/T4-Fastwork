import { describe, expect, test } from 'bun:test';
import { blogPosts as staticPosts } from '@/content/blog';
import {
  BLOG_SELECT,
  getPostBySlug,
  getPosts,
  mapDbPost,
  type BlogDb,
  type BlogSlugDb,
  type DbPostRow,
} from './blog-repo';

function chainList(result: { data: unknown[] | null; error: unknown | null }, calls: string[]) {
  const api = {
    neq(column: string, value: string) {
      calls.push(`neq:${column}:${value}`);
      return api;
    },
    order(column: string, options: { ascending: boolean; nullsFirst?: boolean }) {
      calls.push(`order:${column}:${String(options.ascending)}`);
      return api;
    },
    then(resolve: (v: { data: unknown[] | null; error: unknown | null }) => void) {
      resolve(result);
    },
  };
  return api;
}

function chainSingle(
  result: { data: unknown | null; error: unknown | null },
  calls: string[],
) {
  const api = {
    neq(column: string, value: string) {
      calls.push(`neq:${column}:${value}`);
      return api;
    },
    eq(column: string, value: string) {
      calls.push(`eq:${column}:${value}`);
      return api;
    },
    maybeSingle() {
      calls.push('maybeSingle');
      return Promise.resolve(result);
    },
  };
  return api;
}

function fakeListDb(result: { data: unknown[] | null; error: unknown | null }) {
  const calls: string[] = [];
  const db: BlogDb = {
    from(table) {
      calls.push(`from:${table}`);
      return {
        select(columns: string) {
          calls.push(`select:${columns}`);
          return chainList(result, calls) as ReturnType<BlogDb['from']>['select'] extends (
            c: string,
          ) => infer R
            ? R
            : never;
        },
      };
    },
  };
  return { db, calls };
}

function fakeSlugDb(result: { data: unknown | null; error: unknown | null }) {
  const calls: string[] = [];
  const db: BlogSlugDb = {
    from(table) {
      calls.push(`from:${table}`);
      return {
        select(columns: string) {
          calls.push(`select:${columns}`);
          return chainSingle(result, calls) as never;
        },
      };
    },
  };
  return { db, calls };
}

const sampleRow: DbPostRow = {
  slug: 'hello',
  title: 'Hello',
  excerpt: 'ex',
  content: 'Para one.\n\nPara two.',
  author: 'T4',
  tags: ['AI'],
  published_at: '2026-07-01',
  read_time_min: 3,
  views: 10,
};

describe('mapDbPost', () => {
  test('splits content on blank lines into paragraphs', () => {
    expect(mapDbPost(sampleRow)).toEqual({
      slug: 'hello',
      title: 'Hello',
      excerpt: 'ex',
      content: ['Para one.', 'Para two.'],
      author: 'T4',
      tags: ['AI'],
      publishedAt: '2026-07-01',
      readTimeMin: 3,
      views: 10,
    });
  });
});

describe('getPosts', () => {
  test('excludes case_study rows and maps published human posts', async () => {
    const { db, calls } = fakeListDb({ data: [sampleRow], error: null });
    await expect(getPosts(undefined, db)).resolves.toEqual([mapDbPost(sampleRow)]);
    expect(BLOG_SELECT).toContain('slug');
    expect(calls).toContain('neq:kind:case_study');
    expect(calls[0]).toBe('from:blog_posts');
  });

  test('returns static fallback when the query errors', async () => {
    const { db } = fakeListDb({ data: null, error: { message: 'boom' } });
    await expect(getPosts(undefined, db)).resolves.toEqual(staticPosts);
  });
});

describe('getPostBySlug', () => {
  test('excludes case_study and returns a mapped post', async () => {
    const { db, calls } = fakeSlugDb({ data: sampleRow, error: null });
    await expect(getPostBySlug('hello', db)).resolves.toEqual(mapDbPost(sampleRow));
    expect(calls).toEqual([
      'from:blog_posts',
      `select:${BLOG_SELECT}`,
      'neq:kind:case_study',
      'eq:slug:hello',
      'maybeSingle',
    ]);
  });

  test('falls back to static when the row is missing', async () => {
    const { db } = fakeSlugDb({ data: null, error: null });
    await expect(getPostBySlug('rag-chatbot-for-business', db)).resolves.toEqual(
      staticPosts.find((p) => p.slug === 'rag-chatbot-for-business'),
    );
  });
});
