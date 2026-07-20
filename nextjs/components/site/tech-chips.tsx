import Link from 'next/link';
import { techLogo } from '@/lib/tech-logos';

/**
 * Renders a tech-stack list. Items with a vendored simple-icons SVG show a
 * monochrome logo (via CSS mask, so it inherits the ink/accent colour); items with
 * no real brand mark fall back to a plain text chip.
 *
 * With `linkToFilter` each chip becomes a link into the filtered portfolio
 * (`/projects?tech=…`, Requirement §4.1.8) — the chip classes move onto the
 * anchor so the filter contract (`.tech-chip[href]`) holds.
 */
export function TechChips({
  items,
  linkToFilter = false,
}: {
  items: string[];
  linkToFilter?: boolean;
}) {
  return (
    <ul className="chip-row tech-row">
      {items.map((t) => {
        const logo = techLogo(t);
        const cls = `chip tech-chip${logo ? '' : ' tech-chip-text'}`;
        const inner = (
          <>
            {logo && (
              <span
                className="tech-ico"
                style={{ ['--ico' as string]: `url(${logo})` }}
                aria-hidden="true"
              />
            )}
            {t}
          </>
        );
        return linkToFilter ? (
          <li key={t} className="chip-link-item">
            <Link href={`/projects?tech=${encodeURIComponent(t)}`} className={cls}>
              {inner}
            </Link>
          </li>
        ) : (
          <li key={t} className={cls}>
            {inner}
          </li>
        );
      })}
    </ul>
  );
}
