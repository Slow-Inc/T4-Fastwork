export type Lab3Service = {
  no: string;
  title: string;
  desc: string;
  /** real stack used for this tier */
  stack: string;
  /** complexity rung 1–6 — drives the meter width (Landing → Platform) */
  level: number;
};

/**
 * Services as a complexity ladder (§4.5): one rung per service, ordered from
 * Landing Page to full platform, with a meter that visualises scale instead of
 * six uniform cards.
 */
export function Lab3Services({ items }: { items: Lab3Service[] }) {
  return (
    <div className="lab3-svcs">
      {items.map((s, i) => (
        <article className="lab3-svc" key={s.no} data-rv data-rv-d={String((i % 3) + 1)}>
          <span className="no">{s.no}</span>
          <div className="body">
            <h3>{s.title}</h3>
            <p>{s.desc}</p>
          </div>
          <div className="scale">
            <span className="meter" aria-hidden>
              <i style={{ ['--lv' as string]: String(s.level) }} />
            </span>
            <span className="stack">{s.stack}</span>
          </div>
        </article>
      ))}
    </div>
  );
}
