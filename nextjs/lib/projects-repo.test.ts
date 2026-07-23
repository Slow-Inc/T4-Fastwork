import { test, expect, describe } from 'bun:test';
import { mapDbProject, toneForSlug } from './project-map';
import { isMissingOverviewColumnError } from './projects-select';

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

  test('maps D3 overview card fields when all three TH fields exist', () => {
    const p = mapDbProject({
      ...dbRow,
      overview_summary: 'ภาพรวม',
      overview_highlights: 'ไฮไลต์',
      overview_good_for: 'เหมาะกับ',
      overview_summary_en: 'Overview',
      overview_highlights_en: 'Highlights',
      overview_good_for_en: 'Good for',
    });
    expect(p.overview).toEqual({
      summary: 'ภาพรวม',
      highlights: 'ไฮไลต์',
      goodFor: 'เหมาะกับ',
      summaryEn: 'Overview',
      highlightsEn: 'Highlights',
      goodForEn: 'Good for',
    });
  });

  test('omits overview when any TH field is missing', () => {
    const p = mapDbProject({
      ...dbRow,
      overview_summary: 'only summary',
      overview_highlights: null,
      overview_good_for: null,
    });
    expect(p.overview).toBeUndefined();
  });
});

describe('isMissingOverviewColumnError (#130)', () => {
  test('detects PostgREST unknown-column codes', () => {
    expect(isMissingOverviewColumnError({ code: 'PGRST204' })).toBe(true);
    expect(isMissingOverviewColumnError({ code: '42703' })).toBe(true);
    expect(
      isMissingOverviewColumnError({
        message: "column projects.overview_summary does not exist",
      }),
    ).toBe(true);
    expect(isMissingOverviewColumnError({ code: 'PGRST116' })).toBe(false);
    expect(isMissingOverviewColumnError(null)).toBe(false);
  });
});
