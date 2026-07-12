import { test, expect, describe, afterEach } from 'bun:test';
import { render, screen, cleanup } from '@testing-library/react';
import { Breadcrumb } from './breadcrumb';

afterEach(cleanup);

describe('Breadcrumb', () => {
  test('renders each trail item', () => {
    render(
      <Breadcrumb
        items={[
          { label: 'หน้าแรก', href: '/' },
          { label: 'ผลงาน', href: '/projects' },
          { label: 'MangaDock' },
        ]}
      />,
    );
    expect(screen.getByText('หน้าแรก')).toBeDefined();
    expect(screen.getByText('ผลงาน')).toBeDefined();
    expect(screen.getByText('MangaDock')).toBeDefined();
  });

  test('links items that have an href, and leaves the current page as text', () => {
    render(
      <Breadcrumb
        items={[
          { label: 'หน้าแรก', href: '/' },
          { label: 'MangaDock' },
        ]}
      />,
    );
    expect(screen.getByRole('link', { name: 'หน้าแรก' }).getAttribute('href')).toBe('/');
    expect(screen.queryByRole('link', { name: 'MangaDock' })).toBeNull();
  });

  test('exposes a breadcrumb navigation landmark', () => {
    render(<Breadcrumb items={[{ label: 'หน้าแรก', href: '/' }]} />);
    expect(screen.getByRole('navigation', { name: /breadcrumb/i })).toBeDefined();
  });
});
