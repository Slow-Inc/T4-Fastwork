import { describe, expect, test } from 'bun:test';
import { markdownFileToPostFields } from './markdown-upload';

describe('markdownFileToPostFields', () => {
  test('derives slug from filename and title/excerpt/body from markdown', () => {
    const md = `# Hello World

First paragraph used as excerpt.

## Section

More body text with **bold**.
`;
    expect(markdownFileToPostFields(md, 'Hello World.md')).toEqual({
      title: 'Hello World',
      slug: 'hello-world',
      excerpt: 'First paragraph used as excerpt.',
      content: md.trim(),
      readTimeMin: 1,
    });
  });

  test('falls back to filename stem when there is no h1', () => {
    const md = 'Just a plain note without a heading.';
    expect(markdownFileToPostFields(md, 'plain-note.md')).toMatchObject({
      title: 'plain-note',
      slug: 'plain-note',
      excerpt: 'Just a plain note without a heading.',
      content: md,
    });
  });

  test('rejects empty markdown', () => {
    expect(() => markdownFileToPostFields('   ', 'x.md')).toThrow(/empty/i);
  });

  test('rejects oversized markdown', () => {
    expect(() => markdownFileToPostFields('x'.repeat(200_001), 'big.md')).toThrow(/too large/i);
  });
});
