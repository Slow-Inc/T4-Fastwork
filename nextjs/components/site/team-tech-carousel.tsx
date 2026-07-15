import { TechChips } from './tech-chips';

/**
 * Home "tools our team works with" band — a continuous marquee of the team's tech
 * union (`teamTechnologies`). Reuses `TechChips` (monochrome logo + text fallback);
 * the list is duplicated so the CSS animation loops seamlessly, the duplicate lane
 * `aria-hidden` so screen readers read each tech once. Pure + presentational
 * (hook-free); motion + reduced-motion handled in CSS. Distinct from the §05 filter
 * chips (clickable text) — this is icon, ambient, team-sourced.
 */
export function TeamTechCarousel({ techs }: { techs: string[] }) {
  if (techs.length === 0) return null;
  return (
    <div className="team-tech" aria-label="Technologies our team works with">
      <div className="team-tech-track">
        {[0, 1].map((dup) => (
          <div
            key={dup}
            className="team-tech-lane"
            aria-hidden={dup === 1 || undefined}
          >
            <TechChips items={techs} />
          </div>
        ))}
      </div>
    </div>
  );
}
