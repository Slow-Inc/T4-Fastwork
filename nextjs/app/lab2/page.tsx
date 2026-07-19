import type { Metadata } from 'next';
import { LabHeroSceneLazy } from '@/components/site/lab/lab-hero-scene-lazy';
import { Lab2Reveal } from '@/components/site/lab2/lab2-reveal';

export const metadata: Metadata = {
  title: 'Lab2 — Swiss × Liquid Glass × 3D prototype',
  robots: { index: false, follow: false },
};

const NAV = ['Work', 'Capabilities', 'Process', 'Contact'];

const CAPS = [
  {
    idx: '01',
    title: 'AI products & RAG',
    body: 'Streaming assistants, retrieval over your own corpus, evaluation harnesses — shipped, not demoed.',
    tag: 'LLM · pgvector · SSE',
  },
  {
    idx: '02',
    title: 'Web platforms',
    body: 'Next.js App Router front ends and Nest.js APIs, typed end-to-end, built to scale past the MVP.',
    tag: 'Next.js · Nest.js',
  },
  {
    idx: '03',
    title: 'Data & infrastructure',
    body: 'Postgres, row-level security, pooled connections, migrations you can trust in production.',
    tag: 'Supabase · Drizzle',
  },
  {
    idx: '04',
    title: 'Interfaces with craft',
    body: 'Editorial systems, real-time 3D, motion that signals intent — design as an engineering discipline.',
    tag: 'R3F · GSAP · Swiss',
  },
];

const STATS = [
  { n: '9', unit: '', label: 'Years shipping' },
  { n: '40', unit: '+', label: 'Products launched' },
  { n: '3', unit: '×', label: 'Faster to MVP' },
  { n: '24', unit: '/7', label: 'AI copilots live' },
];

export default function Lab2Page() {
  return (
    <div className="lab2">
      {/* Visible grid — blueprint background layer */}
      <div className="lab2-blueprint" aria-hidden />

      {/* Liquid-glass nav */}
      <nav className="lab2-nav lab2-glass" aria-label="Lab2">
        <span className="lab2-brand">
          <i />
          T4 Labs
        </span>
        <div className="lab2-nav-links">
          {NAV.map((n) => (
            <a key={n} href={`#${n.toLowerCase()}`}>
              {n}
            </a>
          ))}
        </div>
        <button className="lab2-nav-cta" type="button">
          Start a project
        </button>
      </nav>

      {/* Swiss registration marks */}
      <span className="lab2-reg tl" aria-hidden />
      <span className="lab2-reg tr" aria-hidden />

      <main className="lab2-shell">
        {/* ---------------------------------------------------------- hero */}
        <section className="lab2-hero">
          <div className="lab2-hero-copy">
            <span className="lab2-kicker" data-rv>
              <i />
              Software engineering studio
            </span>
            <h1 className="lab2-h1" data-rv data-rv-d="1">
              We build <em>AI-native</em>
              <br />
              software that <span className="lab2-outline">scales</span>
            </h1>
            <p className="lab2-lead" data-rv data-rv-d="2">
              A partner for founders and teams — from a landing page to a
              retrieval-augmented platform, designed and shipped with the care of
              a product studio.
            </p>
            <div className="lab2-actions" data-rv data-rv-d="3">
              <button className="lab2-btn solid" type="button">
                Book a call <span className="arw">→</span>
              </button>
              <button className="lab2-btn ghost" type="button">
                See the work
              </button>
            </div>
          </div>

          {/* 3D anchor + glass spec panels */}
          <div className="lab2-stage">
            <div className="lab2-scene">
              <LabHeroSceneLazy />
            </div>
            <div className="lab2-spec lab2-glass s1" data-rv>
              <div className="k">Model</div>
              <div className="v">
                <span className="dot" />T4-Core · online
              </div>
            </div>
            <div className="lab2-spec lab2-glass s2" data-rv data-rv-d="1">
              <div className="k">Runtime</div>
              <div className="v">RAG · streaming</div>
            </div>
            <div className="lab2-spec lab2-glass s3" data-rv data-rv-d="2">
              <div className="k">Boot sequence</div>
              <div className="v">
                <span className="dot" />assembling…
              </div>
            </div>
          </div>
        </section>

        {/* ---------------------------------------------------- capabilities */}
        <section className="lab2-section" id="capabilities">
          <div className="lab2-sec-head">
            <span className="lab2-sec-num" data-rv>
              02 — What we do
            </span>
            <h2 className="lab2-sec-title" data-rv data-rv-d="1">
              Engineering across the whole stack, with an editorial eye.
            </h2>
          </div>
          <div className="lab2-cards">
            {CAPS.map((c, i) => (
              <article className="lab2-card" key={c.idx} data-rv data-rv-d={String((i % 3) + 1)}>
                <span className="idx">{c.idx}</span>
                <h3>{c.title}</h3>
                <p>{c.body}</p>
                <span className="tag">{c.tag}</span>
              </article>
            ))}
          </div>
        </section>

        {/* ---------------------------------------------------------- stats */}
        <section className="lab2-section" id="process">
          <div className="lab2-stats">
            {STATS.map((s, i) => (
              <div className="lab2-stat" key={s.label} data-rv data-rv-d={String((i % 3) + 1)}>
                <div className="n">
                  {s.n}
                  <em>{s.unit}</em>
                </div>
                <div className="l">{s.label}</div>
              </div>
            ))}
          </div>
        </section>
      </main>

      {/* ---------------------------------------------------------- footer */}
      <footer className="lab2-footer" id="contact">
        <div className="lab2-shell">
          <div className="lab2-wordmark" data-rv>
            T4 LABS
          </div>
        </div>
      </footer>

      <span className="lab2-reg bl" aria-hidden />
      <span className="lab2-reg br" aria-hidden />
      <Lab2Reveal />
    </div>
  );
}
