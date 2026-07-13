import { describe, it, expect } from 'bun:test';
import { parseMarkdown } from './markdown';

describe('parseMarkdown', () => {
  it('parses headings with their level', () => {
    expect(parseMarkdown('# Title')).toEqual([
      { type: 'heading', level: 1, text: 'Title' },
    ]);
    expect(parseMarkdown('### Sub')[0]).toEqual({
      type: 'heading',
      level: 3,
      text: 'Sub',
    });
  });

  it('groups a fenced code block with its language', () => {
    const md = '```ts\nconst a = 1;\nconst b = 2;\n```';
    expect(parseMarkdown(md)).toEqual([
      { type: 'code', lang: 'ts', code: 'const a = 1;\nconst b = 2;' },
    ]);
  });

  it('groups consecutive bullet lines into one list', () => {
    const md = '- one\n- two\n- three';
    expect(parseMarkdown(md)).toEqual([
      { type: 'list', ordered: false, items: ['one', 'two', 'three'] },
    ]);
  });

  it('parses ordered lists', () => {
    expect(parseMarkdown('1. a\n2. b')).toEqual([
      { type: 'list', ordered: true, items: ['a', 'b'] },
    ]);
  });

  it('treats blank-line-separated text as separate paragraphs', () => {
    expect(parseMarkdown('hello world\n\nsecond para')).toEqual([
      { type: 'para', text: 'hello world' },
      { type: 'para', text: 'second para' },
    ]);
  });

  it('parses blockquotes and horizontal rules', () => {
    expect(parseMarkdown('> quoted')).toEqual([
      { type: 'quote', text: 'quoted' },
    ]);
    expect(parseMarkdown('---')).toEqual([{ type: 'hr' }]);
  });

  it('returns an empty array for empty input', () => {
    expect(parseMarkdown('')).toEqual([]);
    expect(parseMarkdown('   \n  ')).toEqual([]);
  });
});
