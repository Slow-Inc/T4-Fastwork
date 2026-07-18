import { test, expect, describe, afterEach } from 'bun:test';
import { render, screen, cleanup } from '@testing-library/react';
import { LabHeroView } from './lab-hero';

afterEach(cleanup);

const props = {
  headline: 'We build software that scales',
  lead: 'A product engineering partner for founders and teams.',
  cta: 'Book a call',
  techs: ['Next.js', 'Nest.js', 'Supabase'],
};

describe('LabHeroView', () => {
  test('renders the headline as the single semantic h1 (a11y + SEO)', () => {
    const { container } = render(<LabHeroView {...props} />);
    const h1 = container.querySelectorAll('h1');
    expect(h1.length).toBe(1);
    expect(h1[0]!.textContent).toContain('We build software that scales');
  });

  test('renders the lead paragraph', () => {
    render(<LabHeroView {...props} />);
    expect(
      screen.getByText('A product engineering partner for founders and teams.'),
    ).toBeDefined();
  });

  test('the primary CTA links to /contact', () => {
    render(<LabHeroView {...props} />);
    const cta = screen.getByRole('link', { name: /Book a call/ });
    expect(cta.getAttribute('href')).toBe('/contact');
  });

  test('renders the tech strip', () => {
    render(<LabHeroView {...props} />);
    props.techs.forEach((t) => expect(screen.getByText(t)).toBeDefined());
  });
});
