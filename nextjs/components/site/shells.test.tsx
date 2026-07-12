import { describe, it, expect, afterEach } from 'bun:test';
import { render, screen, cleanup } from '@testing-library/react';
import { Hero } from './hero';
import { ProcessSchematic } from './process-schematic';
import { processNodes, processSteps } from '@/content/site';

afterEach(cleanup);

describe('Hero', () => {
  it('renders the value-proposition headline', () => {
    render(<Hero />);
    expect(screen.getByRole('heading', { level: 1 }).textContent).toMatch(/SaaS/);
  });

  it('offers both CTAs — book a call and talk to AI', () => {
    render(<Hero />);
    expect(screen.getByRole('link', { name: /Book a call/i })).toBeDefined();
    const ai = screen.getByRole('link', { name: /Talk to our AI/i });
    expect(ai.getAttribute('href')).toBe('/chat');
  });
});

describe('ProcessSchematic', () => {
  it('renders each node in the real request path', () => {
    render(<ProcessSchematic />);
    for (const n of processNodes) expect(screen.getByText(n.name)).toBeDefined();
  });

  it('renders each build step', () => {
    render(<ProcessSchematic />);
    for (const step of processSteps) expect(screen.getByText(step)).toBeDefined();
  });
});
