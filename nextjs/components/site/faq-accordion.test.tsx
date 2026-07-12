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

  test('each item is an individually-observed reveal element with an increasing stagger delay', () => {
    const { container } = render(<FaqAccordion items={items} />);
    const details = container.querySelectorAll('details.faq-item');
    expect(details.length).toBe(items.length);
    details.forEach((d) => {
      expect(d.classList.contains('rv')).toBe(true);
      expect(d.classList.contains('rv-down')).toBe(true);
    });
    const delay = (el: Element) => (el as HTMLElement).style.transitionDelay;
    expect(delay(details[0]!)).toBe('0ms');
    expect(delay(details[1]!)).toBe('60ms');
  });

  test('caps the stagger delay so a long list does not drag out', () => {
    const many = Array.from({ length: 20 }, (_, i) => ({
      question: `Q${i}`,
      answer: `A${i}`,
    }));
    const { container } = render(<FaqAccordion items={many} />);
    const details = container.querySelectorAll('details.faq-item');
    const last = details[details.length - 1] as HTMLElement;
    expect(last.style.transitionDelay).toBe('480ms');
  });
});
