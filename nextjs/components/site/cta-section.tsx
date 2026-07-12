import Link from 'next/link';

/** Closing CTA (Requirement §4.1.9). */
export function CtaSection() {
  return (
    <section className="cta">
      <div className="cta-grid">
        <h2 className="rv">
          Have a product
          <br />
          in <em>mind?</em>
        </h2>
        <div className="side rv">
          <div className="t-meta" style={{ marginBottom: 14 }}>
            เล่าโจทย์ให้เราฟัง — จ้างงานปลอดภัย มีรีวิวคุ้มครองผ่าน Fastwork
          </div>
          <Link href="/contact" className="btn" style={{ padding: '13px 22px' }}>
            Start a project <span>&rarr;</span>
          </Link>
        </div>
      </div>
    </section>
  );
}
