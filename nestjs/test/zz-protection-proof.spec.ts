import { describe, expect, it } from 'bun:test';
// Temporary: proves branch protection refuses a merge while CI is red (#279). Deleted immediately.
describe('protection proof', () => {
  it('fails on purpose', () => {
    expect(1).toBe(2);
  });
});
