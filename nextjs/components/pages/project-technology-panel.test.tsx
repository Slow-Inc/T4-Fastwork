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
    expect(
      container.querySelector('.lang-donut__center-value')?.textContent,
    ).toBe('2');
    expect(
      Array.from(container.querySelectorAll('.lang-donut__pct')).map(
        (element) => element.textContent,
      ),
    ).toEqual(['75.0%', '25.0%']);
  });

  test('renders D4 used-for blurbs under each technology (#131)', () => {
    const { container } = render(
      <ProjectTechnologyPanel
        technologies={['Next.js']}
        technologyDetails={[
          {
            name: 'Next.js',
            usedFor: 'ใช้สร้าง App Router frontend',
            usedForEn: 'Powers the App Router frontend',
          },
        ]}
        tags={[]}
      />,
    );
    expect(container.textContent).toContain('Next.js');
    expect(container.textContent).toContain('ใช้สร้าง App Router frontend');
  });

  test('dedupes duplicate technology names for stable React keys (#184)', () => {
    const { container } = render(
      <ProjectTechnologyPanel
        technologies={['Tailwind CSS', 'Next.js', 'Tailwind CSS']}
        technologyDetails={[
          { name: 'Tailwind CSS' },
          {
            name: 'Tailwind CSS',
            usedFor: 'Utility styling',
            usedForEn: 'Utility styling',
          },
          { name: 'Next.js', usedFor: 'App Router' },
        ]}
        tags={['portfolio', 'portfolio']}
      />,
    );

    const techNames = Array.from(
      container.querySelectorAll('.tech-used-for-item__name'),
    ).map((el) => el.textContent);
    expect(techNames).toEqual(['Tailwind CSS', 'Next.js']);
    expect(container.textContent).toContain('Utility styling');
    expect(container.querySelectorAll('.chip-muted').length).toBe(1);
  });
});
