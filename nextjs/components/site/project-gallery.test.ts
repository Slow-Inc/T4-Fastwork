import { describe, expect, test } from 'bun:test';
import { galleryItems } from './project-gallery';

const project = (slug: string, index: number) => ({
  slug,
  title: `Project ${index}`,
  titleEn: `Project ${index}`,
  description: `Description ${index}`,
  content: [],
  category: index === 1 ? 'AI Product' : '',
  tags: [],
  technologies: index === 2 ? ['Next.js'] : [],
  isFeatured: true,
  tone: 'teal' as const,
  year: '2026',
});

describe('galleryItems', () => {
  test('maps DB projects to four positional mosaic tiles', () => {
    expect(galleryItems([project('one', 1), project('two', 2), project('three', 3)])).toEqual([
      {
        slug: 'one',
        name: 'Project 1',
        caption: 'Project 1 — Description 1',
        tag: 'AI Product',
        tone: 'teal',
        size: 'a',
      },
      {
        slug: 'two',
        name: 'Project 2',
        caption: 'Project 2 — Description 2',
        tag: 'Next.js',
        tone: 'teal',
        size: 'b',
      },
      {
        slug: 'three',
        name: 'Project 3',
        caption: 'Project 3 — Description 3',
        tag: '',
        tone: 'teal',
        size: 'c',
      },
    ]);
  });
});
