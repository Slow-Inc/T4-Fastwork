import { test, expect, describe, afterEach } from 'bun:test';
import { render, screen, cleanup } from '@testing-library/react';
import { TeamTechCarousel } from './team-tech-carousel';

afterEach(cleanup);

describe('TeamTechCarousel', () => {
  test('renders every technology it is given', () => {
    const techs = ['Next.js', 'Supabase', 'React.js'];
    render(<TeamTechCarousel techs={techs} />);
    for (const t of techs) {
      expect(screen.getAllByText(t).length).toBeGreaterThan(0);
    }
  });

  test('renders nothing when there are no technologies', () => {
    const { container } = render(<TeamTechCarousel techs={[]} />);
    expect(container.firstChild).toBeNull();
  });
});
