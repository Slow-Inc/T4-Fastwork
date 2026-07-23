import { afterEach, describe, expect, test } from 'bun:test';
import { cleanup, render } from '@testing-library/react';
import type { Project } from '@/content/catalog';
import type { RepoDetail } from '@/lib/github';
import {
  ProjectBrief,
  ProjectDetailDisclosures,
} from './project-detail-sections';

afterEach(cleanup);

const project: Project = {
  slug: 'language-fixture',
  title: 'Language Fixture',
  titleEn: 'Language Fixture',
  description: 'สรุปโปรเจกต์จากข้อมูลที่มีอยู่',
  descriptionEn: 'An existing project summary.',
  content: ['รายละเอียดฉบับเต็ม'],
  category: 'AI Product',
  tags: ['OCR'],
  technologies: ['Next.js', 'TypeScript'],
  isFeatured: false,
  tone: 'teal',
  year: '2026',
  github: { owner: 't4', repo: 'language-fixture' },
  ownerType: 'team',
  ownerLabel: 'T4 Labs',
};

const detail: RepoDetail = {
  contributors: [],
  pulls: [],
  readme: '# Repository details',
  languages: { TypeScript: 75, CSS: 25 },
};

describe('project detail sections', () => {
  test('keeps language names and percentages in the first-view brief', () => {
    const { container } = render(
      <ProjectBrief project={project} detail={detail} en={false} />,
    );

    const brief = container.querySelector('.project-brief');
    expect(brief?.textContent).toContain('สรุปโปรเจกต์');
    expect(brief?.textContent).toContain('TypeScript');
    expect(brief?.textContent).toContain('75.0%');
    expect(brief?.querySelector('.lang-donut__center-value')?.textContent).toBe(
      '2',
    );
  });

  test('renders the D3 structured overview card when present', () => {
    const withOverview: Project = {
      ...project,
      overview: {
        summary: 'ระบบแปลมังงะ',
        highlights: 'OCR + RAG',
        goodFor: 'สตูดิโอที่อยากสเกล',
        summaryEn: 'Manga translation',
        highlightsEn: 'OCR + RAG',
        goodForEn: 'Studios scaling up',
      },
    };
    const { container } = render(
      <ProjectBrief project={withOverview} detail={detail} en={false} />,
    );
    const card = container.querySelector('.project-overview-card');
    expect(card?.textContent).toContain('ระบบแปลมังงะ');
    expect(card?.textContent).toContain('OCR + RAG');
    expect(card?.textContent).toContain('สตูดิโอที่อยากสเกล');
    expect(card?.textContent).toContain('เหมาะกับใคร');
  });

  test('keeps deep detail and README collapsed by default', () => {
    const { container } = render(
      <ProjectDetailDisclosures
        content={project.content}
        readme={detail.readme}
        en={false}
      />,
    );

    const disclosures = container.querySelectorAll('details');
    expect(disclosures.length).toBe(2);
    expect(disclosures[0].hasAttribute('open')).toBe(false);
    expect(disclosures[1].hasAttribute('open')).toBe(false);
    expect(disclosures[0].textContent).toContain('รายละเอียดฉบับเต็ม');
    expect(disclosures[1].textContent).toContain('Repository details');
  });
});
