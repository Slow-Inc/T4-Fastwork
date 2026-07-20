import { TechChips } from './tech-chips';

/**
 * Home "tools our team works with" band — a continuous marquee of the team's tech
 * union (`teamTechnologies`). Reuses `TechChips` (monochrome logo + text fallback);
 * the list is duplicated so the CSS animation loops seamlessly, the duplicate lane
 * `aria-hidden` so screen readers read each tech once. Pure + presentational
 * (hook-free); motion + reduced-motion handled in CSS.
 *
 * Since the standalone tech-stack section was removed (dev, 2026-07-20), this
 * carousel IS the home's single tech display: it carries `#tech` and each chip
 * links into the filtered portfolio (`/projects?tech=…`, §4.1.8 — e2e-asserted).
 */
export function TeamTechCarousel({ techs }: { techs: string[] }) {
  if (techs.length === 0) return null;
  return (
    <div id="tech" className="team-tech" aria-label="Technologies our team works with">
      <div className="team-tech-track">
        {[0, 1].map((dup) => (
          <div
            key={dup}
            className="team-tech-lane"
            aria-hidden={dup === 1 || undefined}
          >
            <TechChips items={techs} linkToFilter />
          </div>
        ))}
      </div>
    </div>
  );
}
