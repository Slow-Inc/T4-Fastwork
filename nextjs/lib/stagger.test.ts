import { describe, it, expect } from 'bun:test';
import { staggerDelay } from './stagger';

describe('staggerDelay', () => {
  it('grows the entrance delay linearly per item (60ms step by default)', () => {
    expect(staggerDelay(0)).toBe('0ms');
    expect(staggerDelay(1)).toBe('60ms');
    expect(staggerDelay(3)).toBe('180ms');
  });

  it('caps the delay so long lists do not drag out (cap at index 8 by default)', () => {
    expect(staggerDelay(8)).toBe('480ms');
    expect(staggerDelay(20)).toBe('480ms'); // clamped to the cap, not 1200ms
  });

  it('accepts a custom step and cap', () => {
    expect(staggerDelay(2, 40, 4)).toBe('80ms');
    expect(staggerDelay(10, 40, 4)).toBe('160ms'); // capped at index 4 → 4*40
  });
});
