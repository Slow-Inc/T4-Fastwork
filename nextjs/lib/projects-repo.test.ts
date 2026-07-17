import { test, expect, describe } from 'bun:test';
import {
  mapDbProject,
  toneForSlug,
  mergeProjects,
  overlayLiveFields,
} from './project-map';
import type { Project } from '@/content/catalog';

const dbRow = {
  slug: 'admin-added',
  title: 'Admin Added',
  title_en: 'Admin Added',
  description: 'created via CMS',
  content: 'para one\n\npara two',
  live_url: 'https://example.com',
  is_featured: true,
  published_at: '2026-07-01T00:00:00Z',
  category: { name: 'SaaS' },
  project_technologies: [{ technologies: { name: 'Next.js' } }],
  project_tags: [{ tags: { name: 'Dashboard' } }],
};

describe('toneForSlug', () => {
  test('is deterministic and one of the palette tones', () => {
    const a = toneForSlug('foo');
    const b = toneForSlug('foo');
    expect(a).toBe(b);
    expect(['ink', 'sand', 'teal', 'gray']).toContain(a);
  });
});

describe('mapDbProject', () => {
  test('maps DB columns to the Project shape', () => {
    const p = mapDbProject(dbRow);
    expect(p.slug).toBe('admin-added');
    expect(p.title).toBe('Admin Added');
    expect(p.category).toBe('SaaS');
    expect(p.technologies).toEqual(['Next.js']);
    expect(p.tags).toEqual(['Dashboard']);
    expect(p.isFeatured).toBe(true);
    expect(p.content).toEqual(['para one', 'para two']);
    expect(p.year).toBe('2026');
  });

  test('tolerates missing category / joins / content', () => {
    const p = mapDbProject({
      slug: 's',
      title: 'T',
      title_en: null,
      description: null,
      content: null,
      live_url: null,
      is_featured: false,
      published_at: null,
      category: null,
      project_technologies: [],
      project_tags: [],
    });
    expect(p.category).toBe('');
    expect(p.technologies).toEqual([]);
    expect(p.tags).toEqual([]);
    expect(p.content).toEqual([]);
    expect(p.liveUrl).toBeUndefined();
  });
});

describe('mergeProjects', () => {
  const staticProjects: Project[] = [
    {
      slug: 'mangadock',
      title: 'MangaDock',
      titleEn: 'MangaDock',
      description: 'x',
      content: [],
      category: 'AI/Automation',
      tags: [],
      technologies: [],
      isFeatured: true,
      tone: 'teal',
      year: '2025',
    },
  ];

  test('appends DB projects with new slugs', () => {
    const merged = mergeProjects(staticProjects, [mapDbProject(dbRow)]);
    expect(merged.length).toBe(2);
    expect(merged.some((p) => p.slug === 'admin-added')).toBe(true);
  });

  test('static entries win over DB duplicates by slug', () => {
    const dupe = mapDbProject({ ...dbRow, slug: 'mangadock', title: 'From DB' });
    const merged = mergeProjects(staticProjects, [dupe]);
    expect(merged.length).toBe(1);
    expect(merged[0].title).toBe('MangaDock');
  });

  test('overlays the DB snapshotImage onto a same-slug static entry (live field from DB)', () => {
    // Static MangaDock has no snapshotImage; the screenshot worker writes it to
    // the DB. The curated identity stays static; only the live field is overlaid.
    const dbWithShot = mapDbProject({
      ...dbRow,
      slug: 'mangadock',
      title: 'From DB',
      snapshot_image: 'https://cdn.example/mangadock.jpg',
    });
    const merged = mergeProjects(staticProjects, [dbWithShot]);
    expect(merged.length).toBe(1);
    expect(merged[0].title).toBe('MangaDock'); // curated static field preserved
    expect(merged[0].snapshotImage).toBe('https://cdn.example/mangadock.jpg'); // live field overlaid
  });

  test('a DB row without a snapshotImage does not clobber the static entry', () => {
    const dbNoShot = mapDbProject({ ...dbRow, slug: 'mangadock' }); // no snapshot_image
    const merged = mergeProjects(staticProjects, [dbNoShot]);
    expect(merged.length).toBe(1);
    expect(merged[0].snapshotImage).toBeUndefined();
  });
});

describe('overlayLiveFields', () => {
  const base = mapDbProject({ ...dbRow, slug: 'mangadock' }); // no snapshot_image

  test('overlays a DB snapshotImage onto the base entry', () => {
    const db = mapDbProject({
      ...dbRow,
      slug: 'mangadock',
      snapshot_image: 'https://cdn.example/x.jpg',
    });
    expect(overlayLiveFields(base, db).snapshotImage).toBe(
      'https://cdn.example/x.jpg',
    );
  });

  test('an undefined DB row returns the base unchanged', () => {
    expect(overlayLiveFields(base, undefined)).toBe(base);
  });

  test('a null DB snapshotImage does not clobber the base', () => {
    const dbNoShot = mapDbProject({ ...dbRow, slug: 'mangadock' });
    expect(overlayLiveFields(base, dbNoShot).snapshotImage).toBeUndefined();
  });
});
