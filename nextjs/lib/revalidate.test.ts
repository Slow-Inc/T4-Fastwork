import { describe, it, expect } from 'bun:test';
import {
  constantTimeEqual,
  authorizeRevalidate,
  contentRevalidationTargets,
  revalidationTargets,
} from './revalidate';

describe('constantTimeEqual', () => {
  it('true for equal strings, false for different', () => {
    expect(constantTimeEqual('secret', 'secret')).toBe(true);
    expect(constantTimeEqual('secret', 'other')).toBe(false);
  });

  it('false when either side is empty/undefined (never matches a blank)', () => {
    expect(constantTimeEqual('', '')).toBe(false);
    expect(constantTimeEqual(undefined, 'x')).toBe(false);
    expect(constantTimeEqual('x', undefined)).toBe(false);
  });

  it('handles different lengths without throwing', () => {
    expect(constantTimeEqual('short', 'a-much-longer-secret')).toBe(false);
  });
});

describe('authorizeRevalidate', () => {
  it('authorizes only when the header matches the configured secret', () => {
    expect(authorizeRevalidate('s3cr3t', 's3cr3t')).toBe(true);
    expect(authorizeRevalidate('wrong', 's3cr3t')).toBe(false);
  });

  it('fails closed when the secret is not configured', () => {
    expect(authorizeRevalidate('anything', undefined)).toBe(false);
    expect(authorizeRevalidate('anything', '')).toBe(false);
  });

  it('rejects a missing header', () => {
    expect(authorizeRevalidate(undefined, 's3cr3t')).toBe(false);
  });
});

describe('revalidationTargets', () => {
  it('without a slug: the list + every project detail page', () => {
    expect(revalidationTargets()).toEqual([
      { path: '/projects' },
      { path: '/projects/[slug]', type: 'page' },
    ]);
  });

  it('with a slug: the list + that one detail page', () => {
    expect(revalidationTargets('mangadock')).toEqual([
      { path: '/projects' },
      { path: '/projects/mangadock' },
    ]);
  });

  it('ignores a blank slug (falls back to all detail pages)', () => {
    expect(revalidationTargets('')).toEqual([
      { path: '/projects' },
      { path: '/projects/[slug]', type: 'page' },
    ]);
  });
});

describe('contentRevalidationTargets', () => {
  it('targets the public surface for each CMS content kind', () => {
    expect(contentRevalidationTargets('faq')).toEqual([{ path: '/faq' }]);
    expect(contentRevalidationTargets('service')).toEqual([{ path: '/' }]);
    expect(contentRevalidationTargets('certificate')).toEqual([
      { path: '/' },
      { path: '/about' },
    ]);
    expect(contentRevalidationTargets('blog')).toEqual([
      { path: '/blog' },
      { path: '/sitemap.xml' },
    ]);
  });
});
