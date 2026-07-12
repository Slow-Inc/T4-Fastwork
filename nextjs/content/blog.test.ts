import { test, expect, describe } from 'bun:test';
import { blogPosts, getPost, searchPosts } from './blog';

describe('blog content', () => {
  test('every post has the fields the pages rely on', () => {
    for (const p of blogPosts) {
      expect(p.slug).toBeTruthy();
      expect(p.title).toBeTruthy();
      expect(p.excerpt).toBeTruthy();
      expect(p.content.length).toBeGreaterThan(0);
      expect(p.readTimeMin).toBeGreaterThan(0);
    }
  });

  test('slugs are unique', () => {
    const slugs = blogPosts.map((p) => p.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
  });
});

describe('getPost', () => {
  test('returns a post by slug', () => {
    expect(getPost(blogPosts[0].slug)?.title).toBe(blogPosts[0].title);
  });
  test('returns undefined for unknown slug', () => {
    expect(getPost('nope')).toBeUndefined();
  });
});

describe('searchPosts', () => {
  test('returns all posts newest-first when no query', () => {
    const r = searchPosts();
    expect(r.length).toBe(blogPosts.length);
    for (let i = 1; i < r.length; i++) {
      expect(r[i - 1].publishedAt >= r[i].publishedAt).toBe(true);
    }
  });

  test('filters by keyword in title/excerpt/tags', () => {
    const r = searchPosts('RAG');
    expect(r.length).toBeGreaterThan(0);
    expect(r.every((p) => `${p.title} ${p.excerpt} ${p.tags.join(' ')}`.toLowerCase().includes('rag'))).toBe(true);
  });

  test('unmatched query returns empty', () => {
    expect(searchPosts('zzzznope').length).toBe(0);
  });
});
