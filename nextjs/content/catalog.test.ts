import { test, expect, describe } from 'bun:test';
import { filterProjectList, facetsFor, type Project } from './catalog';

/** Sample projects standing in for a DB-fetched list — the helpers are pure and
 * operate on whatever list /projects passes them, so they're tested in isolation
 * (the real data now lives in the DB, not a static catalog). */
const sample: Project[] = [
  {
    slug: 'mangadock',
    title: 'MangaDock',
    titleEn: 'MangaDock',
    description: 'AI manga translation',
    content: [],
    category: 'AI/Automation',
    tags: ['OCR', 'RAG'],
    technologies: ['Next.js', 'Supabase'],
    isFeatured: true,
    tone: 'teal',
    year: '2025',
  },
  {
    slug: 'listing',
    title: 'Listing',
    titleEn: 'Listing',
    description: 'property marketplace',
    content: [],
    category: 'Marketplace',
    tags: ['Dashboard'],
    technologies: ['React', 'Supabase'],
    isFeatured: false,
    tone: 'ink',
    year: '2024',
  },
];

describe('filterProjectList', () => {
  test('no filters returns every project', () => {
    expect(filterProjectList(sample, {}).length).toBe(sample.length);
  });

  test('filters by category', () => {
    const result = filterProjectList(sample, { category: 'AI/Automation' });
    expect(result.map((p) => p.slug)).toEqual(['mangadock']);
  });

  test('filters by technology (case-insensitive)', () => {
    const result = filterProjectList(sample, { tech: 'supabase' });
    expect(result.length).toBe(2);
  });

  test('filters by tag', () => {
    const result = filterProjectList(sample, { tag: 'OCR' });
    expect(result.map((p) => p.slug)).toEqual(['mangadock']);
  });

  test('featured tab returns only featured projects', () => {
    const result = filterProjectList(sample, { featured: true });
    expect(result.every((p) => p.isFeatured)).toBe(true);
    expect(result.map((p) => p.slug)).toEqual(['mangadock']);
  });

  test('keyword search matches title or description', () => {
    expect(filterProjectList(sample, { q: 'manga' }).map((p) => p.slug)).toEqual([
      'mangadock',
    ]);
  });

  test('unmatched keyword returns empty', () => {
    expect(filterProjectList(sample, { q: 'zzzznotathing' }).length).toBe(0);
  });

  test('combines filters (AND semantics)', () => {
    const result = filterProjectList(sample, {
      category: 'AI/Automation',
      tech: 'react',
    });
    expect(result.length).toBe(0);
  });

  test('an empty list yields no results (DB unreachable / no published rows)', () => {
    expect(filterProjectList([], { featured: true })).toEqual([]);
  });
});

describe('facetsFor', () => {
  test('derives unique, sorted categories/technologies/tags from the list', () => {
    const f = facetsFor(sample);
    expect(f.categories).toEqual(['AI/Automation', 'Marketplace']);
    expect(f.technologies).toEqual(['Next.js', 'React', 'Supabase']);
    expect(f.tags).toEqual(['Dashboard', 'OCR', 'RAG']);
  });

  test('an empty list yields empty facets', () => {
    expect(facetsFor([])).toEqual({ categories: [], technologies: [], tags: [] });
  });
});
