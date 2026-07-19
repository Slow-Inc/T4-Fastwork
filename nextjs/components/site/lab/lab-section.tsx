import type { ReactNode } from 'react';

/** Shared section header for the /lab long page — a small mono kicker over a big
 *  display title (the ChainGPT "labs" section rhythm). Pure/presentational. */
export function LabSectionHeader({
  kicker,
  title,
  id,
}: {
  kicker: string;
  title: ReactNode;
  id?: string;
}) {
  return (
    <div className="lab-sec-head" id={id}>
      <span className="lab-kicker">
        <i />
        {kicker}
      </span>
      <h2 className="lab-sec-title">{title}</h2>
    </div>
  );
}
