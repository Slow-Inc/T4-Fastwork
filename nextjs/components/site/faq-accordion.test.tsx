import { test, expect, describe, afterEach } from 'bun:test';
import { render, screen, cleanup } from '@testing-library/react';
import { FaqAccordion } from './faq-accordion';

afterEach(cleanup);

const items = [
  { question: 'ใช้เวลากี่วัน?', answer: 'ไม่กี่สัปดาห์ถึง 1–3 เดือน' },
  { question: 'ราคาเท่าไหร่?', answer: 'ขึ้นกับขอบเขตงาน' },
];

describe('FaqAccordion', () => {
  test('renders every question', () => {
    render(<FaqAccordion items={items} />);
    expect(screen.getByText('ใช้เวลากี่วัน?')).toBeDefined();
    expect(screen.getByText('ราคาเท่าไหร่?')).toBeDefined();
  });

  test('renders every answer', () => {
    render(<FaqAccordion items={items} />);
    expect(screen.getByText('ไม่กี่สัปดาห์ถึง 1–3 เดือน')).toBeDefined();
    expect(screen.getByText('ขึ้นกับขอบเขตงาน')).toBeDefined();
  });

  test('uses native disclosure so it works without JS', () => {
    const { container } = render(<FaqAccordion items={items} />);
    const details = container.querySelectorAll('details');
    expect(details.length).toBe(items.length);
    expect(container.querySelectorAll('summary').length).toBe(items.length);
  });
});
