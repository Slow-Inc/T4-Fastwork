import { test, expect, describe } from 'bun:test';
import {
  projects,
  getProject,
  filterProjects,
  projectCategories,
  projectTechnologies,
  projectTags,
} from './catalog';

describe('project catalog data', () => {
  test('every project has the fields the pages rely on', () => {
    for (const p of projects) {
      expect(p.slug).toBeTruthy();
      expect(p.title).toBeTruthy();
      expect(p.category).toBeTruthy();
      expect(Array.isArray(p.technologies)).toBe(true);
      expect(Array.isArray(p.tags)).toBe(true);
    }
  });

  test('slugs are unique', () => {
    const slugs = projects.map((p) => p.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
  });

  test('mangadock (the real flagship) is present and featured', () => {
    const m = getProject('mangadock');
    expect(m).toBeDefined();
    expect(m?.isFeatured).toBe(true);
  });
});

describe('getProject', () => {
  test('returns the project for a known slug', () => {
    expect(getProject('mangadock')?.title).toBeTruthy();
  });

  test('returns undefined for an unknown slug', () => {
    expect(getProject('does-not-exist')).toBeUndefined();
  });
});

describe('filterProjects', () => {
  test('no filters returns every project', () => {
    expect(filterProjects({}).length).toBe(projects.length);
  });

  test('filters by category', () => {
    const cat = projects[0].category;
    const result = filterProjects({ category: cat });
    expect(result.length).toBeGreaterThan(0);
    expect(result.every((p) => p.category === cat)).toBe(true);
  });

  test('filters by technology (case-insensitive)', () => {
    const tech = projects.find((p) => p.technologies.length)!.technologies[0];
    const result = filterProjects({ tech: tech.toLowerCase() });
    expect(result.length).toBeGreaterThan(0);
    expect(
      result.every((p) =>
        p.technologies.some((t) => t.toLowerCase() === tech.toLowerCase()),
      ),
    ).toBe(true);
  });

  test('filters by tag', () => {
    const tag = projects.find((p) => p.tags.length)!.tags[0];
    const result = filterProjects({ tag });
    expect(result.length).toBeGreaterThan(0);
    expect(result.every((p) => p.tags.includes(tag))).toBe(true);
  });

  test('featured tab returns only featured projects', () => {
    const result = filterProjects({ featured: true });
    expect(result.length).toBeGreaterThan(0);
    expect(result.every((p) => p.isFeatured)).toBe(true);
  });

  test('keyword search matches title or description', () => {
    const result = filterProjects({ q: 'manga' });
    expect(result.some((p) => p.slug === 'mangadock')).toBe(true);
  });

  test('unmatched keyword returns empty', () => {
    expect(filterProjects({ q: 'zzzznotathing' }).length).toBe(0);
  });

  test('combines filters (AND semantics)', () => {
    const p = projects[0];
    const result = filterProjects({ category: p.category, tech: p.technologies[0] });
    expect(result.every((r) => r.category === p.category)).toBe(true);
  });
});

describe('derived facets', () => {
  test('categories, technologies and tags are unique and non-empty', () => {
    expect(projectCategories.length).toBeGreaterThan(0);
    expect(new Set(projectCategories).size).toBe(projectCategories.length);
    expect(new Set(projectTechnologies).size).toBe(projectTechnologies.length);
    expect(new Set(projectTags).size).toBe(projectTags.length);
  });
});
