export type Lab3StackNode = {
  id: string;
  /** layer label — CLIENT / EDGE / API / DATA / AI */
  label: string;
  /** real tech behind the layer, e.g. "Supabase · pgvector" */
  tech: string;
  desc: string;
};

export type Lab3ProcessStep = { no: string; title: string; desc: string };

/**
 * Immersive system schematic (§14.18): the real request path
 * Client → Edge → API → Data → AI drawn with CSS/typography + a signal trace,
 * tied to the Discovery → Architecture → Build → Ship → Scale process rail.
 * Pure markup — the trace pulse and hover states live in CSS.
 */
export function Lab3Schematic({
  stack,
  process,
}: {
  stack: Lab3StackNode[];
  process: Lab3ProcessStep[];
}) {
  return (
    <div className="lab3-schematic">
      <div className="lab3-stack" role="list" aria-label="Request path">
        {stack.map((n, i) => (
          <div className="lab3-node" role="listitem" key={n.id} data-rv data-rv-d={String((i % 3) + 1)}>
            <span className="coord" aria-hidden>
              L{i + 1}
            </span>
            <span className="lbl">{n.label}</span>
            <span className="tech">{n.tech}</span>
            <span className="d">{n.desc}</span>
            {i < stack.length - 1 && (
              <span className="trace" aria-hidden>
                <i />
              </span>
            )}
          </div>
        ))}
      </div>
      <ol className="lab3-process">
        {process.map((p) => (
          <li className="lab3-step" key={p.no} data-rv>
            <span className="no">{p.no}</span>
            <span className="t">{p.title}</span>
            <span className="d">{p.desc}</span>
          </li>
        ))}
      </ol>
    </div>
  );
}
