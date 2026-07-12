import { test, expect, describe } from 'bun:test';
import {
  getSolutionDetail,
  solutionSlugs,
  featureGroups,
  previewScreens,
} from './solution-detail';

describe('getSolutionDetail', () => {
  test('resolves each of the six solution types', () => {
    for (const slug of ['saas', 'webapp', 'ai-product', 'mvp', 'internal-system', 'other']) {
      const d = getSolutionDetail(slug);
      expect(d).toBeDefined();
      expect(d?.headline).toBeTruthy();
      expect(d?.valueProps.length).toBe(4);
    }
  });

  test('returns undefined for an unknown type', () => {
    expect(getSolutionDetail('nope')).toBeUndefined();
  });

  test('exposes exactly the six slugs', () => {
    expect(solutionSlugs.length).toBe(6);
  });
});

describe('shared content', () => {
  test('feature checklist has 6 groups, each with items', () => {
    expect(featureGroups.length).toBe(6);
    expect(featureGroups.every((g) => g.items.length > 0)).toBe(true);
  });

  test('interactive preview has 9 screens with components', () => {
    expect(previewScreens.length).toBe(9);
    expect(previewScreens.every((s) => s.components.length > 0)).toBe(true);
  });
});
