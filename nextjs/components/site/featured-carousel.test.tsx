import { test, expect, describe, afterEach } from 'bun:test';
import { render, screen, cleanup } from '@testing-library/react';
import { FeaturedCarousel } from './featured-carousel';
import type { Project } from '@/content/catalog';

afterEach(cleanup);

const featured: Pick<Project, 'slug' | 'title' | 'description' | 'tone' | 'category'>[] = [
  { slug: 'mangadock', title: 'MangaDock', description: 'AI manga', tone: 'teal', category: 'AI/Automation' },
  { slug: 'listingthai', title: 'ListingThai', description: 'marketplace', tone: 'ink', category: 'Marketplace' },
];

describe('FeaturedCarousel', () => {
  test('renders a slide per featured project', () => {
    render(<FeaturedCarousel projects={featured as Project[]} />);
    expect(screen.getAllByText('MangaDock').length).toBeGreaterThan(0);
    expect(screen.getAllByText('ListingThai').length).toBeGreaterThan(0);
  });

  test('each slide links to the project detail', () => {
    render(<FeaturedCarousel projects={featured as Project[]} />);
    expect(
      screen.getByRole('link', { name: /MangaDock/ }).getAttribute('href'),
    ).toBe('/projects/mangadock');
  });

  test('is a scrollable track (overflow container present)', () => {
    const { container } = render(<FeaturedCarousel projects={featured as Project[]} />);
    expect(container.querySelector('.carousel-track')).not.toBeNull();
  });

  test('renders nothing when there are no featured projects', () => {
    const { container } = render(<FeaturedCarousel projects={[]} />);
    expect(container.querySelector('.carousel-track')).toBeNull();
  });
});
