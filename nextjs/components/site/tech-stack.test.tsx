import { test, expect, describe, afterEach } from 'bun:test';
import { render, screen, cleanup } from '@testing-library/react';
import { TechStackView } from './tech-stack';

afterEach(cleanup);

describe('TechStack', () => {
  test('renders a chip per technology', () => {
    render(<TechStackView en={false} techs={['Next.js', 'Supabase']} />);
    expect(screen.getByText('Next.js')).toBeDefined();
    expect(screen.getByText('Supabase')).toBeDefined();
  });

  test('each chip links to the projects filter for that tech', () => {
    render(<TechStackView en={false} techs={['Next.js']} />);
    const link = screen.getByRole('link', { name: 'Next.js' });
    expect(link.getAttribute('href')).toBe('/projects?tech=Next.js');
  });
});
