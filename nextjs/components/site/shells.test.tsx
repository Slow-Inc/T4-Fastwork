import { describe, it, expect, afterEach } from 'bun:test';
import { render, screen, cleanup } from '@testing-library/react';
import { HeroView } from './hero';
import { ProcessSchematicView } from './process-schematic';
import { SdlcSectionView } from './sdlc-section';
import { TeamSectionView } from './team-section-view';
import { TeamMemberView } from './team-member-view';
import { TechChips } from './tech-chips';
import { processNodes, processSteps, sdlcPhases, team, teamProjects } from '@/content/site';

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

describe('TeamSection (directory on /about)', () => {
  it('renders one directory row per member, each linking to their profile page', () => {
    const { container } = render(
      <TeamSectionView en={false} members={team} projects={teamProjects} />,
    );
    const rows = container.querySelectorAll('.team-dir-item');
    expect(rows.length).toBe(team.length);
    for (const m of team) {
      const link = container.querySelector(`a[href="/team/${m.slug}"]`);
      expect(link).not.toBeNull();
      expect(link?.textContent).toContain(m.handle);
    }
  });

  it('renders the shared team (org) projects with contributors', () => {
    const { container } = render(
      <TeamSectionView en={false} members={team} projects={teamProjects} />,
    );
    const projs = container.querySelectorAll('.team-projects .team-proj');
    expect(projs.length).toBe(teamProjects.length);
    // MangaDock is a real Slow-Inc repo credited to xenodev + akkanop-x.
    expect(screen.getByText('MangaDock')).toBeDefined();
  });
});

describe('TechChips', () => {
  it('shows a masked logo for known brands and a plain text chip otherwise', () => {
    const { container } = render(<TechChips items={['Next.js', 'Radmin']} />);
    const chips = Array.from(container.querySelectorAll('.tech-chip'));
    const next = chips.find((c) => c.textContent === 'Next.js');
    const radmin = chips.find((c) => c.textContent === 'Radmin');
    // Next.js resolves to a vendored icon → carries a mask element.
    expect(next?.querySelector('.tech-ico')).not.toBeNull();
    // Radmin has no brand mark → text-chip fallback, no icon.
    expect(radmin?.querySelector('.tech-ico')).toBeNull();
    expect(radmin?.classList.contains('tech-chip-text')).toBe(true);
  });
});

describe('TeamMemberView (profile page)', () => {
  const xeno = team.find((m) => m.slug === 'xenodev')!;

  it('renders the member headline and role', () => {
    render(<TeamMemberView member={xeno} en={false} />);
    expect(screen.getByRole('heading', { level: 1 }).textContent).toBe(xeno.handle);
    expect(screen.getAllByText(xeno.role).length).toBeGreaterThan(0);
  });

  it('lists the real audited repos as projects', () => {
    render(<TeamMemberView member={xeno} en={false} />);
    for (const p of xeno.projects!) {
      const link = screen.getByRole('link', { name: new RegExp(p.name.replace('.', '\\.')) });
      expect(link.getAttribute('href')).toBe(p.url);
    }
  });

  it('shows each certificate image with a download link when no lightbox handler is given', () => {
    const { container } = render(<TeamMemberView member={xeno} en={false} />);
    const imgs = container.querySelectorAll('.tm-cert-open img');
    expect(imgs.length).toBe(xeno.certificates!.length);
    // First cert (AI for All) links to its real PDF for download/view.
    const firstLink = container.querySelector('.tm-cert-open') as HTMLAnchorElement;
    expect(firstLink.getAttribute('href')).toBe('/certificates/xenodev/ai-for-all.pdf');
  });

  it('omits the projects and certificates blocks for a member with none (Slowgers)', () => {
    const slow = team.find((m) => m.slug === 'slowgers')!;
    const { container } = render(<TeamMemberView member={slow} en={false} />);
    expect(container.querySelector('.tm-projects')).toBeNull();
    expect(container.querySelector('.tm-certs')).toBeNull();
  });
});
