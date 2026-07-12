import { describe, it, expect, afterEach } from 'bun:test';
import { render, screen, cleanup } from '@testing-library/react';
import { HeroView } from './hero';
import { ProcessSchematicView } from './process-schematic';
import { SdlcSectionView } from './sdlc-section';
import { processNodes, processSteps, sdlcPhases } from '@/content/site';

afterEach(cleanup);

const heroCopy = {
  availability: 'Open for Q3 · 2026',
  lead: 'A product engineering partner',
  proof: '20+ years',
  bookCall: 'Book a call',
  talkAi: 'Talk to our AI',
};

describe('Hero', () => {
  it('renders the value-proposition headline', () => {
    render(<HeroView {...heroCopy} />);
    expect(screen.getByRole('heading', { level: 1 }).textContent).toMatch(/SaaS/);
  });

  it('offers both CTAs — book a call and talk to AI', () => {
    render(<HeroView {...heroCopy} />);
    expect(screen.getByRole('link', { name: /Book a call/i })).toBeDefined();
    const ai = screen.getByRole('link', { name: /Talk to our AI/i });
    expect(ai.getAttribute('href')).toBe('/chat');
  });
});

describe('ProcessSchematic', () => {
  it('renders each node in the real request path', () => {
    render(<ProcessSchematicView en={false} />);
    for (const n of processNodes) expect(screen.getByText(n.name)).toBeDefined();
  });

  it('renders each build step', () => {
    render(<ProcessSchematicView en={false} />);
    for (const step of processSteps) expect(screen.getByText(step)).toBeDefined();
  });
});

describe('SdlcSection', () => {
  it('renders every SDLC phase title (Thai)', () => {
    render(<SdlcSectionView en={false} />);
    for (const phase of sdlcPhases) {
      expect(screen.getByText(phase.title)).toBeDefined();
    }
  });

  it('renders every SDLC phase title (English)', () => {
    render(<SdlcSectionView en={true} />);
    for (const phase of sdlcPhases) {
      expect(screen.getByText(phase.titleEn)).toBeDefined();
    }
  });

  it('renders the phases in order (01 → 06)', () => {
    const { container } = render(<SdlcSectionView en={false} />);
    const indices = Array.from(container.querySelectorAll('.sdlc-row .sdlc-num')).map(
      (el) => el.textContent,
    );
    expect(indices).toEqual(sdlcPhases.map((p) => p.index));
  });
});
