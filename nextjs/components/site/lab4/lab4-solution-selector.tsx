export type Lab4Solution = {
  type: string;
  title: string;
  desc: string;
  /** mono metadata line, e.g. "MULTI-TENANT · BILLING" */
  meta: string;
  /** wide = full-bleed editorial row, narrow = compact cell (§14.10 — no 6 identical cards) */
  span: 'wide' | 'narrow';
};

export function Lab4SolutionSelector({ items }: { items: Lab4Solution[] }) {
  return (
    <div className="lab4-sols">
      {items.map((s, i) => (
        <a
          key={s.type}
          className={`lab4-sol ${s.span}`}
          href={`/recommend/${s.type}`}
          data-rv
          data-rv-d={String((i % 3) + 1)}
        >
          <span className="idx" aria-hidden>
            {String(i + 1).padStart(2, '0')}
          </span>
          <span className="body">
            <span className="t">{s.title}</span>
            <span className="d">{s.desc}</span>
          </span>
          <span className="meta" aria-hidden>
            {s.meta}
          </span>
          <span className="arw" aria-hidden>
            →
          </span>
        </a>
      ))}
    </div>
  );
}
