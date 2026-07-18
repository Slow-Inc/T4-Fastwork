import { test, expect, describe, afterEach } from 'bun:test';
import { render, screen, cleanup } from '@testing-library/react';
import { LabSectionHeader } from './lab-section';
import { LabCapabilitiesView } from './lab-capabilities';
import { LabHowWeWorkView } from './lab-how-we-work';
import { LabSelectedWorkView } from './lab-selected-work';
import { LabStatsView } from './lab-stats';

afterEach(cleanup);

describe('LabSectionHeader', () => {
  test('renders the kicker and an h2 title', () => {
    const { container } = render(
      <LabSectionHeader kicker="What we do" title="Capabilities" />,
    );
    expect(screen.getByText('What we do')).toBeDefined();
    const h2 = container.querySelector('h2.lab-sec-title');
    expect(h2?.textContent).toContain('Capabilities');
  });
});

describe('LabCapabilitiesView', () => {
  const items = [
    { no: '01', title: 'Web apps', desc: 'scale' },
    { no: '02', title: 'AI & RAG', desc: 'grounded' },
  ];
  test('renders a cell per capability with its number + title', () => {
    const { container } = render(<LabCapabilitiesView items={items} />);
    expect(container.querySelectorAll('.lab-cap-cell').length).toBe(2);
    expect(screen.getByText('Web apps')).toBeDefined();
    expect(screen.getByText('02')).toBeDefined();
  });
  test('staggers the reveal delay and caps it', () => {
    const many = Array.from({ length: 20 }, (_, i) => ({
      no: `${i}`,
      title: `T${i}`,
      desc: 'd',
    }));
    const { container } = render(<LabCapabilitiesView items={many} />);
    const last = container.querySelectorAll('.lab-cap-cell')[19] as HTMLElement;
    expect(last.style.transitionDelay).toBe('480ms');
  });
});

describe('LabHowWeWorkView', () => {
  test('renders each process step in order', () => {
    const steps = [
      { no: '01', title: 'Discover', desc: 'a' },
      { no: '02', title: 'Design', desc: 'b' },
      { no: '03', title: 'Build', desc: 'c' },
    ];
    const { container } = render(<LabHowWeWorkView steps={steps} />);
    expect(container.querySelectorAll('.lab-flow-node').length).toBe(3);
    expect(screen.getByText('Discover')).toBeDefined();
    expect(screen.getByText('Build')).toBeDefined();
  });
});

describe('LabSelectedWorkView', () => {
  const items = [
    {
      name: 'MangaDock',
      category: 'Platform',
      href: '/projects/mangadock',
      metrics: [
        { label: 'Year', value: '2024' },
        { label: 'Role', value: 'Full-stack' },
      ],
    },
  ];
  test('renders a card linking to the project with its metrics', () => {
    render(<LabSelectedWorkView items={items} />);
    const link = screen.getByRole('link', { name: /MangaDock/ });
    expect(link.getAttribute('href')).toBe('/projects/mangadock');
    expect(screen.getByText('2024')).toBeDefined();
    expect(screen.getByText('Full-stack')).toBeDefined();
  });
});

describe('LabStatsView', () => {
  test('renders each stat value + label', () => {
    const stats = [
      { value: '7', label: 'Years' },
      { value: '21+', label: 'Projects' },
    ];
    const { container } = render(<LabStatsView stats={stats} />);
    expect(container.querySelectorAll('.lab-stat').length).toBe(2);
    expect(screen.getByText('21+')).toBeDefined();
    expect(screen.getByText('Years')).toBeDefined();
  });
});
