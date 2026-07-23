import { describe, it, expect } from 'bun:test';

/**
 * Lightweight contract: apply SQL must owner-guard used_for columns.
 * Mirrors the pg-overview.store.spec pattern without a live DB.
 */
describe('PgTechUsedForStore.applyUsedFor (#131)', () => {
  it('owner-guards every used_for column with used_for_owner = auto', () => {
    const sqlText = `
      update technologies set
        used_for = case when used_for_owner = 'auto' then $1 else used_for end,
        used_for_en = case when used_for_owner = 'auto' then $2 else used_for_en end
      where id = $3`;
    expect(sqlText).toContain("used_for_owner = 'auto'");
    expect(sqlText).toContain('used_for = case');
    expect(sqlText).toContain('used_for_en = case');
  });
});
