import { test, expect, describe, afterEach } from 'bun:test';
import { render, screen, cleanup } from '@testing-library/react';
import { Lab3SolutionSelector, type Lab3Solution } from './lab3-solution-selector';
import { Lab3Schematic, type Lab3StackNode, type Lab3ProcessStep } from './lab3-schematic';
import { Lab3Services, type Lab3Service } from './lab3-services';

afterEach(cleanup);

describe('Lab3SolutionSelector', () => {
  const solutions: Lab3Solution[] = [
    { type: 'saas', title: 'SaaS Platform', desc: 'multi-tenant', meta: 'multi-tenant · billing', span: 'wide' },
    { type: 'webapp', title: 'Web Application', desc: 'ระบบซับซ้อน', meta: 'marketplace', span: 'wide' },
    { type: 'ai-product', title: 'AI Product', desc: 'chatbot', meta: 'RAG · OCR', span: 'wide' },
    { type: 'mvp', title: 'MVP for Startup', desc: 'launch เร็ว', meta: 'launch', span: 'narrow' },
    { type: 'internal-system', title: 'Internal System', desc: 'หลังบ้าน', meta: 'integration', span: 'narrow' },
    { type: 'other', title: 'อื่นๆ', desc: 'โจทย์เฉพาะ', meta: 'consult', span: 'narrow' },
  ];
  test('renders one linked row per solution pointing at /recommend/[type]', () => {
    const { container } = render(<Lab3SolutionSelector items={solutions} />);
    const rows = container.querySelectorAll('a.lab3-sol');
    expect(rows.length).toBe(6);
    expect(screen.getByRole('link', { name: /SaaS Platform/ }).getAttribute('href')).toBe(
      '/recommend/saas',
    );
    expect(screen.getByRole('link', { name: /อื่นๆ/ }).getAttribute('href')).toBe(
      '/recommend/other',
    );
  });
  test('varies composition via the span modifier (no 6 identical cards)', () => {
    const { container } = render(<Lab3SolutionSelector items={solutions} />);
    expect(container.querySelectorAll('.lab3-sol.wide').length).toBe(3);
    expect(container.querySelectorAll('.lab3-sol.narrow').length).toBe(3);
  });
});

describe('Lab3Schematic', () => {
  const stack: Lab3StackNode[] = [
    { id: 'client', label: 'CLIENT', tech: 'Next.js', desc: 'App Router UI' },
    { id: 'edge', label: 'EDGE', tech: 'Cloudflare', desc: 'CDN · WAF' },
    { id: 'api', label: 'API', tech: 'Nest.js', desc: 'Business logic' },
    { id: 'data', label: 'DATA', tech: 'Supabase · pgvector', desc: 'Postgres + RLS' },
    { id: 'ai', label: 'AI', tech: 'LLM · RAG', desc: 'Streaming answers' },
  ];
  const process: Lab3ProcessStep[] = [
    { no: '01', title: 'Discovery', desc: 'a' },
    { no: '02', title: 'Architecture', desc: 'b' },
    { no: '03', title: 'Build', desc: 'c' },
    { no: '04', title: 'Ship', desc: 'd' },
    { no: '05', title: 'Scale', desc: 'e' },
  ];
  test('renders the five real stack nodes with their tech labels', () => {
    const { container } = render(<Lab3Schematic stack={stack} process={process} />);
    expect(container.querySelectorAll('.lab3-node').length).toBe(5);
    expect(screen.getByText('CLIENT')).toBeDefined();
    expect(screen.getByText('Supabase · pgvector')).toBeDefined();
  });
  test('renders the five process steps in order', () => {
    const { container } = render(<Lab3Schematic stack={stack} process={process} />);
    const steps = Array.from(container.querySelectorAll('.lab3-step .t')).map(
      (el) => el.textContent,
    );
    expect(steps).toEqual(['Discovery', 'Architecture', 'Build', 'Ship', 'Scale']);
  });
});

describe('Lab3Services', () => {
  const services: Lab3Service[] = [
    { no: '01', title: 'Landing Page', desc: 'เร็ว สวย', stack: 'Next.js', level: 1 },
    { no: '02', title: 'Web Application', desc: 'ระบบซับซ้อน', stack: 'Next.js · Nest.js', level: 3 },
    { no: '03', title: 'SaaS Platform', desc: 'multi-tenant', stack: 'Supabase', level: 6 },
  ];
  test('renders a rung per service with a complexity meter scaled by level', () => {
    const { container } = render(<Lab3Services items={services} />);
    const rungs = container.querySelectorAll('.lab3-svc');
    expect(rungs.length).toBe(3);
    const meters = container.querySelectorAll<HTMLElement>('.lab3-svc .meter i');
    expect(meters[0].style.getPropertyValue('--lv')).toBe('1');
    expect(meters[2].style.getPropertyValue('--lv')).toBe('6');
    expect(screen.getByText('Next.js · Nest.js')).toBeDefined();
  });
});
