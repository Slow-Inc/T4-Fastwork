import { test, expect, describe, afterEach } from 'bun:test';
import { render, screen, cleanup } from '@testing-library/react';
import { ProjectCardView } from './project-card';
import type { Project } from '@/content/catalog';

afterEach(cleanup);

const sample: Project = {
  slug: 'mangadock',
  title: 'MangaDock',
  titleEn: 'MangaDock',
  description: 'AI manga translation platform',
  content: ['para'],
  category: 'AI/Automation',
  tags: ['RAG', 'OCR'],
  technologies: ['Next.js', 'Nest.js'],
  liveUrl: 'https://mangadock.com',
  isFeatured: true,
  tone: 'teal',
  year: '2025',
};

describe('ProjectCard', () => {
  test('shows the title, category and description', () => {
    render(<ProjectCardView project={sample} />);
    expect(screen.getByRole('heading', { name: 'MangaDock' })).toBeDefined();
    expect(screen.getByText('AI/Automation')).toBeDefined();
    expect(screen.getByText('AI manga translation platform')).toBeDefined();
  });

  test('links to the detail page', () => {
    render(<ProjectCardView project={sample} />);
    const detail = screen.getByRole('link', { name: /ดูรายละเอียด/i });
    expect(detail.getAttribute('href')).toBe('/projects/mangadock');
  });

  test('shows a live-site link (new tab, noopener) when present', () => {
    render(<ProjectCardView project={sample} />);
    const live = screen.getByRole('link', { name: /ดูเว็บจริง/i });
    expect(live.getAttribute('href')).toBe('https://mangadock.com');
    expect(live.getAttribute('target')).toBe('_blank');
    expect(live.getAttribute('rel')).toContain('noopener');
  });

  test('renders a featured badge for featured projects', () => {
    render(<ProjectCardView project={sample} />);
    expect(screen.getByText(/แนะนำ/)).toBeDefined();
  });

  test('omits the live link when the project has no live url', () => {
    render(<ProjectCardView project={{ ...sample, liveUrl: undefined }} />);
    expect(screen.queryByRole('link', { name: /ดูเว็บจริง/i })).toBeNull();
  });

  test('labels a team project with an owner badge (spec P5)', () => {
    render(
      <ProjectCardView
        project={{ ...sample, ownerType: 'team', ownerLabel: 'T4 Labs' }}
      />,
    );
    expect(screen.getByText(/T4 Labs · ทีม/)).toBeDefined();
  });

  test('labels a personal project as ส่วนตัว', () => {
    render(
      <ProjectCardView
        project={{ ...sample, ownerType: 'personal', ownerLabel: '@xenodeve' }}
      />,
    );
    expect(screen.getByText(/@xenodeve · ส่วนตัว/)).toBeDefined();
  });

  test('omits the owner badge when ownerType is absent', () => {
    render(<ProjectCardView project={sample} />);
    expect(screen.queryByText(/· ทีม|· ส่วนตัว/)).toBeNull();
  });
});
