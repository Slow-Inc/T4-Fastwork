import { techLogo } from '@/lib/tech-logos';

/**
 * Renders a tech-stack list. Items with a vendored simple-icons SVG show a
 * monochrome logo (via CSS mask, so it inherits the ink/accent colour); items with
 * no real brand mark fall back to a plain text chip.
 */
export function TechChips({ items }: { items: string[] }) {
  return (
    <ul className="chip-row tech-row">
      {items.map((t) => {
        const logo = techLogo(t);
        return (
          <li key={t} className={`chip tech-chip${logo ? '' : ' tech-chip-text'}`}>
            {logo && (
              <span
                className="tech-ico"
                style={{ ['--ico' as string]: `url(${logo})` }}
                aria-hidden="true"
              />
            )}
            {t}
          </li>
        );
      })}
    </ul>
  );
}
