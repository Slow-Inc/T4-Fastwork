import { describe, it, expect } from 'bun:test';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { projects } from '../src/database/schema/content.ts';

/**
 * #170 — AI-fillable owners must default to auto (empty imports stay enrichable).
 * Regression: previous DB default 'human' made generate-taxonomy candidates=0.
 */
describe('projects AI-fillable owner defaults (#170)', () => {
  it('drizzle schema defaults content/category/tags/tech owners to auto', () => {
    const cols = projects as unknown as {
      contentOwner: { default: string | null | undefined };
      categoryOwner: { default: string | null | undefined };
      tagsOwner: { default: string | null | undefined };
      technologiesOwner: { default: string | null | undefined };
      titleOwner: { default: string | null | undefined };
      overviewOwner: { default: string | null | undefined };
    };
    // Drizzle Column has .default; assert via SQL migration file when runtime shape differs.
    const migration = readFileSync(
      join(
        import.meta.dir,
        '../../supabase/migrations/0031_ai_fillable_owner_defaults.sql',
      ),
      'utf8',
    );
    expect(migration).toContain("content_owner SET DEFAULT 'auto'");
    expect(migration).toContain("category_owner SET DEFAULT 'auto'");
    expect(migration).toContain("tags_owner SET DEFAULT 'auto'");
    expect(migration).toContain("technologies_owner SET DEFAULT 'auto'");
    expect(migration).not.toContain("title_owner SET DEFAULT 'auto'");

    // Schema source of truth for Nest inserts that use column defaults
    const src = readFileSync(
      join(import.meta.dir, '../src/database/schema/content.ts'),
      'utf8',
    );
    expect(src).toMatch(
      /contentOwner: text\('content_owner'\)\.notNull\(\)\.default\('auto'\)/,
    );
    expect(src).toMatch(
      /categoryOwner: text\('category_owner'\)\.notNull\(\)\.default\('auto'\)/,
    );
    expect(src).toMatch(
      /tagsOwner: text\('tags_owner'\)\.notNull\(\)\.default\('auto'\)/,
    );
    expect(src).toMatch(
      /technologiesOwner: text\('technologies_owner'\)\.notNull\(\)\.default\('auto'\)/,
    );
    expect(src).toMatch(
      /titleOwner: text\('title_owner'\)\.notNull\(\)\.default\('human'\)/,
    );
    void cols;
  });
});
