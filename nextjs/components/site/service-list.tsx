import { services } from '@/content/services';

/** Homepage services (Requirement §4.5). */
export function ServiceList() {
  return (
    <section id="services" className="section">
      <div className="srv-head rv">
        <div className="t-idx">03 — Services</div>
        <h2>From one page to a whole platform.</h2>
      </div>
      <div className="rv">
        {services.map((s) => (
          <div className="srv-row" key={s.no}>
            <span className="t-meta">{s.no}</span>
            <span className="sn">{s.title}</span>
            <span className="sd">{s.description}</span>
          </div>
        ))}
      </div>
    </section>
  );
}
