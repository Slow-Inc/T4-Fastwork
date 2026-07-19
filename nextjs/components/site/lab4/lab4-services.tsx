export type Lab4Service = {
  no: string;
  title: string;
  desc: string;
  stack: string;
  /** complexity rung 1–6 — drives the meter width (Landing → full platform) */
  level: number;
};

export function Lab4Services({ items }: { items: Lab4Service[] }) {
  return (
    <div className="lab4-svcs">
      {items.map((s) => (
        <div className="lab4-svc" key={s.no} data-rv>
          <span className="no">{s.no}</span>
          <div className="body">
            <h3>{s.title}</h3>
            <p>{s.desc}</p>
          </div>
          <div className="scale">
            <span className="meter" aria-hidden>
              <i style={{ '--lv': String(s.level) } as React.CSSProperties} />
            </span>
            <span className="stack">{s.stack}</span>
          </div>
        </div>
      ))}
    </div>
  );
}
