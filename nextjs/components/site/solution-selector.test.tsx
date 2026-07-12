import { describe, it, expect, afterEach } from 'bun:test';
import { render, screen, cleanup } from '@testing-library/react';
import { SolutionSelector } from './solution-selector';
import { solutions } from '@/content/solutions';

afterEach(cleanup);

describe('SolutionSelector', () => {
  it('renders every solution title', () => {
    render(<SolutionSelector />);
    for (const s of solutions) {
      expect(screen.getByText(s.title)).toBeDefined();
    }
  });

  it('links each solution to /recommend/<slug>', () => {
    render(<SolutionSelector />);
    const saas = screen.getByRole('link', { name: /SaaS Platform/ });
    expect(saas.getAttribute('href')).toBe('/recommend/saas');
    const ai = screen.getByRole('link', { name: /AI Product/ });
    expect(ai.getAttribute('href')).toBe('/recommend/ai-product');
  });

  it('shows the section index label', () => {
    render(<SolutionSelector />);
    expect(screen.getByText(/Solutions/i)).toBeDefined();
  });
});
