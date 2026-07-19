export type Lab4StackNode = {
  id: string;
  /** layer label — CLIENT / EDGE / API / DATA / AI */
  label: string;
  /** real tech behind the layer, e.g. "Supabase · pgvector" */
  tech: string;
  desc: string;
  /** when set the node renders as a link — the AI node opens the live /chat (§14.18) */
  href?: string;
};

export type Lab4ProcessStep = { no: string; title: string; desc: string };

/**
 * Immersive system schematic (requirement3.md §14.18): the real request path
 * Client → Edge (CDN·WAF·Cache) → API → Data → AI drawn with CSS/typography +
 * signal traces. The AI node is a real door into the live chatbot, proving the
 * system on display actually runs.
 */
export function Lab4Schematic({
  stack,
  process,
}: {
  stack: Lab4StackNode[];
  process: Lab4ProcessStep[];
}) {
  return (
    <div className="lab4-schematic">
      <div className="lab4-stack" role="list" aria-label="Request path">
        {stack.map((n, i) => {
          const inner = (
            <>
              <span className="coord" aria-hidden>
                L{i + 1}
              </span>
              <span className="lbl">{n.label}</span>
              <span className="tech">{n.tech}</span>
              <span className="d">{n.desc}</span>
              {n.href && (
                <span className="go" aria-hidden>
                  เปิดระบบจริง →
                </span>
              )}
              {i < stack.length - 1 && (
                <span className="trace" aria-hidden>
                  <i />
                </span>
              )}
            </>
          );
          return (
            <div role="listitem" key={n.id} className="lab4-cell">
              {n.href ? (
                <a className="lab4-node link" href={n.href} data-rv data-rv-d={String((i % 3) + 1)}>
                  {inner}
                </a>
              ) : (
                <div className="lab4-node" data-rv data-rv-d={String((i % 3) + 1)}>
                  {inner}
                </div>
              )}
            </div>
          );
        })}
      </div>
      <ol className="lab4-process">
        {process.map((p) => (
          <li className="lab4-step" key={p.no} data-rv>
            <span className="no">{p.no}</span>
            <span className="t">{p.title}</span>
            <span className="d">{p.desc}</span>
          </li>
        ))}
      </ol>
    </div>
  );
}
