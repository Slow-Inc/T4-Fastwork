import { afterEach, describe, expect, test } from 'bun:test';
import { cleanup, render } from '@testing-library/react';
import { ProjectTechnologyPanel } from './project-technology-panel';

afterEach(cleanup);

describe('ProjectTechnologyPanel', () => {
  test('renders technology chips, tags, and the D1 language donut together', () => {
    const { container } = render(
      <ProjectTechnologyPanel
        technologies={['Next.js', 'TypeScript']}
        tags={['portfolio']}
        languages={{ TypeScript: 75, CSS: 25 }}
      />,
    );

    expect(container.querySelectorAll('.chip:not(.chip-muted)').length).toBe(2);
    expect(container.querySelectorAll('.chip-muted').length).toBe(1);
    expect(container.querySelector('.meta-langs')).not.toBeNull();
    expect(
      container.querySelector('svg[aria-label^="สัดส่วนภาษา:"]'),
    ).not.toBeNull();
  });
});
