import { sdlcPhases } from '@/content/site';

/**
 * Editorial "list in column" (Requirement §14.4) — hairline-divided rows with
 * a large mono index, not a card grid, so it reads as its own distinct
 * section rather than repeating the grid pattern used nearby (about-grid /
 * about-steps). Shared between the homepage and /about so the copy and
 * layout for this motif live in exactly one place.
 */
export function SdlcList({ en }: { en: boolean }) {
  return (
    <ol className="sdlc-list">
      {sdlcPhases.map((s) => (
        <li key={s.index} className="sdlc-row">
          <span className="sdlc-num" aria-hidden="true">
            {s.index}
          </span>
          <div className="sdlc-row-body">
            <h3>{en ? s.titleEn : s.title}</h3>
            <p>{en ? s.descriptionEn : s.description}</p>
          </div>
        </li>
      ))}
    </ol>
  );
}
