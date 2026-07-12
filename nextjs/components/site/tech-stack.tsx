import Link from 'next/link';

/** Homepage tech-stack section (Requirement §4.1.8): each tag filters /projects. */
export function TechStack({ techs }: { techs: string[] }) {
  return (
    <section id="tech" className="section">
      <div className="work-head rv">
        <h2>Tech stack</h2>
        <div style={{ textAlign: 'right' }}>
          <div className="t-idx">05 — Stack</div>
          <div className="t-meta" style={{ marginTop: 6 }}>
            คลิกเพื่อกรองผลงาน
          </div>
        </div>
      </div>
      <div className="tech-chips rv">
        {techs.map((tech) => (
          <Link key={tech} href={`/projects?tech=${tech}`} className="tech-chip">
            {tech}
          </Link>
        ))}
      </div>
    </section>
  );
}
