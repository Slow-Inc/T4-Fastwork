import Link from 'next/link';
import { solutions } from '@/content/solutions';

/** Homepage Solution Selector (Requirement §4.1.3). */
export function SolutionSelector() {
  return (
    <section id="solutions" className="section">
      <div className="sol-grid">
        <div className="sol-title rv">
          <div className="t-idx">01 — Solutions</div>
          <h2>Pick your problem. We speak product.</h2>
          <p className="t-body">
            เลือกโจทย์ที่ใกล้เคียงที่สุด แล้วเราจะพาไปดูเคสงานและ approach
            ที่ตรงกับคุณ
          </p>
        </div>
        <div className="sol-list rv">
          {solutions.map((s) => (
            <Link key={s.slug} href={`/recommend/${s.slug}`} className="sol-row">
              <span className="t-meta">{s.code}</span>
              <div>
                <div className="nm">{s.title}</div>
                <div className="ds t-meta">{s.description}</div>
              </div>
              <span className="go">&rarr;</span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
