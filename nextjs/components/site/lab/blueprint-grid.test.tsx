import { test, expect, describe, afterEach } from 'bun:test';
import { render, cleanup } from '@testing-library/react';
import { BlueprintGrid } from './blueprint-grid';

afterEach(cleanup);

describe('BlueprintGrid', () => {
  test('renders four corner registration marks (the "spec sheet" framing)', () => {
    const { container } = render(<BlueprintGrid />);
    expect(container.querySelectorAll('.bp-corner').length).toBe(4);
  });

  test('is purely decorative — aria-hidden so it adds no noise for screen readers', () => {
    const { container } = render(<BlueprintGrid />);
    const root = container.querySelector('.blueprint-grid');
    expect(root).not.toBeNull();
    expect(root!.getAttribute('aria-hidden')).toBe('true');
  });
});
