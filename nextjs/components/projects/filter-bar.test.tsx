import { test, expect, describe, afterEach } from 'bun:test';
import { render, screen, cleanup } from '@testing-library/react';
import { FilterBar } from './filter-bar';

afterEach(cleanup);

const facets = {
  categories: ['AI/Automation', 'SaaS'],
  technologies: ['Next.js', 'React'],
  tags: ['RAG', 'Dashboard'],
};

describe('FilterBar', () => {
  test('submits via GET to /projects (deep-linkable)', () => {
    const { container } = render(<FilterBar facets={facets} current={{}} />);
    const form = container.querySelector('form')!;
    expect(form.getAttribute('method')?.toLowerCase()).toBe('get');
    expect(form.getAttribute('action')).toBe('/projects');
  });

  test('has a keyword search input named q', () => {
    render(<FilterBar facets={facets} current={{}} />);
    const input = screen.getByPlaceholderText(/ค้นหา/) as HTMLInputElement;
    expect(input.getAttribute('name')).toBe('q');
  });

  test('renders category, tech and tag selects with the facet options', () => {
    render(<FilterBar facets={facets} current={{}} />);
    expect(screen.getByRole('option', { name: 'AI/Automation' })).toBeDefined();
    expect(screen.getByRole('option', { name: 'Next.js' })).toBeDefined();
    expect(screen.getByRole('option', { name: 'RAG' })).toBeDefined();
  });

  test('preselects the current filter values', () => {
    render(
      <FilterBar
        facets={facets}
        current={{ category: 'SaaS', q: 'manga' }}
      />,
    );
    const q = screen.getByPlaceholderText(/ค้นหา/) as HTMLInputElement;
    expect(q.value).toBe('manga');
    const cat = screen.getByLabelText(/หมวดหมู่/) as HTMLSelectElement;
    expect(cat.value).toBe('SaaS');
  });

  test('offers an all / featured tab pair', () => {
    render(<FilterBar facets={facets} current={{}} />);
    expect(screen.getByRole('link', { name: /ทั้งหมด/ })).toBeDefined();
    expect(screen.getByRole('link', { name: /แนะนำ/ })).toBeDefined();
  });
});
