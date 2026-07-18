import { test, expect, describe, afterEach } from 'bun:test';
import { render, screen, cleanup } from '@testing-library/react';
import { KineticMarquee } from './kinetic-marquee';

afterEach(cleanup);

describe('KineticMarquee', () => {
  test('renders the given text', () => {
    render(<KineticMarquee text="BUILDING TOMORROW" />);
    expect(screen.getAllByText('BUILDING TOMORROW').length).toBeGreaterThan(0);
  });

  test('duplicates the text so the CSS loop is seamless', () => {
    // A single continuous marquee needs a second identical copy to translate into.
    render(<KineticMarquee text="BUILDING TOMORROW" />);
    expect(screen.getAllByText('BUILDING TOMORROW').length).toBe(2);
  });

  test('is decorative — the whole band is aria-hidden so SR does not read it twice', () => {
    const { container } = render(<KineticMarquee text="BUILDING TOMORROW" />);
    const root = container.querySelector('.kinetic-marquee');
    expect(root).not.toBeNull();
    expect(root!.getAttribute('aria-hidden')).toBe('true');
  });
});
