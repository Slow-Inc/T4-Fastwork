import { describe, it, expect, afterEach } from 'bun:test';
import { render, screen, cleanup } from '@testing-library/react';
import { HeroView } from './hero';
import { ProcessSchematicView } from './process-schematic';
import { SdlcSectionView } from './sdlc-section';
import { TeamSectionView } from './team-section';
import { processNodes, processSteps, sdlcPhases, team } from '@/content/site';

afterEach(cleanup);

const heroCopy = {
  availability: 'Open for Q3 · 2026',
  lead: 'A product engineering partner',
  proof: '5 years',
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

describe('TeamSection', () => {
  it('renders every team member by handle', () => {
    render(<TeamSectionView en={false} />);
    for (const m of team) {
      expect(screen.getAllByText(m.handle).length).toBeGreaterThan(0);
    }
  });

  it('renders every member\'s role (Thai)', () => {
    render(<TeamSectionView en={false} />);
    for (const m of team) expect(screen.getByText(m.role)).toBeDefined();
  });

  it('renders every card as its own real profile, not a shared generic list', () => {
    const { container } = render(<TeamSectionView en={false} />);
    const cards = container.querySelectorAll('.team-card');
    expect(cards.length).toBe(team.length);
  });

  it('renders stack chips only for members that have one (Slowgers has none)', () => {
    const { container } = render(<TeamSectionView en={false} />);
    const cards = Array.from(container.querySelectorAll('.team-card'));
    const slowgersCard = cards.find((c) => c.textContent?.includes('Slowgers'));
    expect(slowgersCard?.querySelector('.team-stack')).toBeNull();

    const xenodevCard = cards.find((c) => c.textContent?.includes('xenodev'));
    expect(xenodevCard?.querySelector('.team-stack')).not.toBeNull();
  });

  it("renders each member's own certificates, not a shared/merged list", () => {
    render(<TeamSectionView en={false} />);
    // NVIDIA is xenodev's cert only; SET is Thanathorn's cert only.
    expect(screen.getByText('AI for All: From Basics to GenAI Practice')).toBeDefined();
    expect(screen.getByText('Entrepreneurial Mindset')).toBeDefined();
    // Both xenodev and Paradise separately completed the same course.
    expect(screen.getAllByText('Road to Data Scientists').length).toBe(2);
  });
});
