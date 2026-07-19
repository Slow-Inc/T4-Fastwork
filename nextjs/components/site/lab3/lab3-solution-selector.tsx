import Link from 'next/link';

export type Lab3Solution = {
  /** recommend route slug — saas | webapp | ai-product | mvp | internal-system | other */
  type: string;
  title: string;
  desc: string;
  /** mono meta line, e.g. "multi-tenant · subscription · dashboard" */
  meta: string;
  /** composition variant — the three primary briefs span wide, the rest narrow */
  span: 'wide' | 'narrow';
};

/**
 * Solution selector (§4.1.3) as a typographic index, not six identical cards:
 * wide rows carry the primary briefs, narrow rows the secondary ones, all
 * sharing the same grid tracks (Swiss layer) with a signal-trace hover.
 */
export function Lab3SolutionSelector({ items }: { items: Lab3Solution[] }) {
  return (
    <div className="lab3-sols">
      {items.map((s, i) => (
        <Link
          key={s.type}
          href={`/recommend/${s.type}`}
          className={`lab3-sol ${s.span}`}
          data-rv
          data-rv-d={String((i % 3) + 1)}
        >
          <span className="idx">{String(i + 1).padStart(2, '0')}</span>
          <span className="body">
            <span className="t">{s.title}</span>
            <span className="d">{s.desc}</span>
          </span>
          <span className="meta">{s.meta}</span>
          <span className="arw" aria-hidden>
            →
          </span>
        </Link>
      ))}
    </div>
  );
}
