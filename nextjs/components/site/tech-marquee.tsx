/**
 * A continuously-scrolling marquee of the full tech stack (spec 2026-07-14, P8,
 * Requirement §4.1.8). Pure + presentational. The list is duplicated so the CSS
 * animation loops seamlessly; the duplicate is `aria-hidden` so screen readers
 * read each tech once. Respects `prefers-reduced-motion` via CSS.
 */
export function TechMarquee({ techs }: { techs: string[] }) {
  if (techs.length === 0) return null;
  return (
    <div className="tech-marquee" aria-label="Technologies we use">
      <div className="tech-marquee-track">
        {[0, 1].map((dup) => (
          <ul
            key={dup}
            className="tech-marquee-row"
            aria-hidden={dup === 1 || undefined}
          >
            {techs.map((t) => (
              <li key={`${dup}-${t}`} className="tech-marquee-item">
                {t}
              </li>
            ))}
          </ul>
        ))}
      </div>
    </div>
  );
}
