import type { Metadata } from "next";
import Link from "next/link";
import { SiteNav } from "@/components/site/site-nav";
import { SiteFooter } from "@/components/site/site-footer";
import { ChatButton } from "@/components/site/chat-button";
import { RevealObserver } from "@/components/site/reveal-observer";
import { SmoothScroll } from "@/components/site/smooth-scroll";
import { SdlcSection } from "@/components/site/sdlc-section";
import { TeamSection } from "@/components/site/team-section";
import { TeamTechSection } from "@/components/site/team-tech-section";
import { KineticMarquee } from "@/components/site/lab/kinetic-marquee";
import { Lab4Fx } from "@/components/site/lab4/lab4-fx";
import { Lab4ThemeToggle } from "@/components/site/lab4/lab4-theme-toggle";
import { Lab4ResetButton } from "@/components/site/lab4/lab4-reset-button";
import { Lab4RobotStageLazy } from "@/components/site/lab4/lab4-robot-stage-lazy";
import { Lab4SolutionSelector } from "@/components/site/lab4/lab4-solution-selector";
import { Lab4Schematic } from "@/components/site/lab4/lab4-schematic";
import { Lab4Services } from "@/components/site/lab4/lab4-services";
import { SOLUTIONS, STACK, PROCESS, SERVICES } from "@/content/home-v3";
import { filterProjects } from "@/content/catalog";
import { getProjectRankMap } from "@/lib/projects-repo";
import { getSiteStats } from "@/lib/site-stats";
import { orderByRank } from "@/lib/project-rank";

// pre-paint theme (requirement3 §14.7): attribute on the .lab4 div itself —
// never <html> (hydration mismatch); shares the lab4 localStorage key so the
// prototype and the live home stay in the same theme while both exist
const THEME_INIT = `(function(){var el=document.currentScript.closest('.lab4');var t;try{t=localStorage.getItem('lab4-theme')}catch(e){}if(t!=='light'&&t!=='dark'){t=matchMedia('(prefers-color-scheme: light)').matches?'light':'dark'}el.dataset.lab4Theme=t})()`;

export const metadata: Metadata = {
  title: "Legacy home (v2 backup) — T4 Labs",
  robots: { index: false, follow: false },
};

/**
 * BACKUP of the previous live home, kept verbatim at /legacy-2 (dev directive
 * 2026-07-20). The live `/` now renders the /lab4 composition unchanged. This
 * page is the lab4-first hybrid it replaced — keep it reachable but unindexed
 * so the product parts it carries (SiteNav, SDLC, Team, work rows) stay easy to
 * compare and lift back if wanted.
 *
 * Previous doc comment:
 * Live home = the /lab4 composition, lab4-first (dev directive 2026-07-20,
 * ADR 0011 + issue #110): the prototype IS the page, and only the essential
 * product parts move in — SiteNav (dev keeps its design), the team tech
 * marquee (#tech filter contract), SDLC + Team (§14.3 + tested), and
 * SiteFooter's utility links under the wordmark band. Proof-of-work is a
 * lab4-NATIVE Swiss row list (not the req1 carousel), certificates live on
 * /about (the trust strip carries the count).
 */
export default async function Home() {
  const [rank, stats] = await Promise.all([getProjectRankMap(), getSiteStats()]);
  // live headline stats drive the trust strip (same source as the old hero)
  const trust = [
    { n: String(stats.years), unit: "ปี", label: "ประสบการณ์ทีม" },
    { n: String(stats.projects), unit: "+", label: "โปรเจกต์ที่ส่งมอบ" },
    { n: String(stats.certs), unit: "", label: "ใบรับรองของทีม" },
  ];
  // top-ranked proof for the Swiss work rows (AI display-rank, ADR 0008)
  const work = orderByRank(filterProjects({ featured: true }), rank).slice(0, 5);
  return (
    <div className="lab4 lab4-home" suppressHydrationWarning>
      <script dangerouslySetInnerHTML={{ __html: THEME_INIT }} />

      {/* blueprint field — visible at the hero, fading to quiet below (§14.5) */}
      <div className="lab4-field" aria-hidden />

      {/* the site nav owns search / locale / tracked links (tested contract);
          the theme switch floats beside it inside the themed shell */}
      <SiteNav />
      <div className="lab4-theme-float">
        <Lab4ThemeToggle />
      </div>

      <main className="lab4-shell">
        {/* ------------------------------------------------ 00 · hero thesis */}
        <section className="lab4-hero">
          <div className="lab4-marquee">
            <KineticMarquee text="BUILDING TOMORROW —" />
          </div>

          <div className="lab4-hero-grid">
            <div className="lab4-hero-cell copy">
              <span className="lab4-coord" data-rv>
                <i aria-hidden />
                00 — POSITIONING
              </span>
              <h1 className="lab4-h1" data-rv data-rv-d="1">
                อยากมีเว็บแบบไหน เรา<em>สร้างได้</em> — ตั้งแต่หน้าเดียว
                ถึงระดับ product
              </h1>
              <p className="lab4-lead" data-rv data-rv-d="2">
                เว็บร้านค้า, SaaS, Web Application, AI Product —
                มาตรฐานวิศวกรรมเดียวกันทุกสเกล คุยกับ dev โดยตรง
                ไม่ต้องรู้ศัพท์เทคนิค
              </p>
              <div className="lab4-actions" data-rv data-rv-d="3">
                <a className="lab4-btn solid" href="/contact">
                  ติดต่อ / จ้างงาน <span className="arw">→</span>
                </a>
                <a className="lab4-btn ghost" href="/chat">
                  คุยกับ AI
                </a>
              </div>
            </div>

            {/* zone marker 1 — the robot's home cell; grab = drag-to-rotate */}
            <div
              className="lab4-stage"
              data-l4-zone="hero"
              data-l4-grab
              data-l4-scale="0.8"
            >
              <div className="lab4-scene-fallback" aria-hidden />
            </div>

            <div className="lab4-hero-cell meta">
              <div className="lab4-meta-block" data-rv>
                <span className="k">Brand character</span>
                <span className="v">
                  <i className="dot" />
                  T4 Bot · brand AI
                </span>
              </div>
              <div className="lab4-meta-block" data-rv data-rv-d="2">
                <span className="k">Interaction</span>
                <span className="v">DRAG TO ROTATE</span>
                <Lab4ResetButton />
              </div>
              <div className="lab4-meta-block grow" data-rv data-rv-d="3">
                <span className="k">Bangkok, TH</span>
                <span className="v">FULL-STACK + AI</span>
              </div>
            </div>
          </div>

          {/* trust strip — proof, not decoration (21+ claim is load-bearing) */}
          <dl className="lab4-trust" data-rv>
            {trust.map((t) => (
              <div key={t.label}>
                <dt>
                  {t.n}
                  <em>{t.unit}</em>
                </dt>
                <dd>{t.label}</dd>
              </div>
            ))}
          </dl>
        </section>

        {/* ambient team tech-stack marquee (ledger "Phase A" band, back by dev
            request) — the home's single tech display: #tech, chips filter
            /projects?tech= (§4.1.8) */}
        <TeamTechSection />

        {/* ---------------------------------------------- 01 · solution index */}
        <section className="lab4-section" id="solutions">
          <header className="lab4-sec-head">
            <span className="lab4-coord" data-rv>
              01 — SOLUTIONS
            </span>
            <h2 data-rv data-rv-d="1">
              เริ่มจากโจทย์ของคุณ
              <span className="soft"> ไม่ใช่เทคโนโลยี</span>
            </h2>
          </header>
          <Lab4SolutionSelector items={SOLUTIONS} />
        </section>

        {/* ------------------------------------------------ 02 · proof of work */}
        {/* ------------------------------------------ 02 · proof of work
            lab4-NATIVE Swiss rows (replaces the req1 carousel): rank-ordered
            real projects, each row a door into its case study (§14.3) */}
        <section className="lab4-section" id="work">
          <header className="lab4-sec-head">
            <span className="lab4-coord" data-rv>
              02 — SELECTED WORK
            </span>
            <h2 data-rv data-rv-d="1">
              หลักฐานผลงาน
              <span className="soft"> ที่ส่งมอบจริง</span>
            </h2>
          </header>
          <div className="lab4-works" data-rv data-rv-d="2">
            {work.map((p, i) => (
              <Link key={p.slug} href={`/projects/${p.slug}`} className="lab4-work">
                <span className="no">{String(i + 1).padStart(2, "0")}</span>
                <span className="body">
                  <span className="t">{p.title}</span>
                  <span className="d">{p.description}</span>
                </span>
                <span className="meta">
                  {p.category} · {p.year}
                </span>
                <span className="arw" aria-hidden>
                  →
                </span>
              </Link>
            ))}
          </div>
          <Link className="lab4-works-all" href="/projects" data-rv>
            ดูผลงานทั้งหมด <span className="arw">→</span>
          </Link>
        </section>

        {/* ------------------------------------------- 03 · system schematic */}
        <section className="lab4-section" id="how">
          <header className="lab4-sec-head with-dock">
            <div>
              <span className="lab4-coord" data-rv>
                03 — HOW WE BUILD
              </span>
              <h2 data-rv data-rv-d="1">
                สถาปัตยกรรมชุดเดียวกับที่หน้านี้รันอยู่
              </h2>
              <p className="lab4-sec-note" data-rv data-rv-d="2">
                ไม่ใช่ diagram ประกอบ — นี่คือ request path จริงของระบบเรา
                กดที่ node AI เพื่อเปิดแชตบอทตัวจริงได้เลย
              </p>
            </div>
            {/* zone marker 2 — the robot tours the stack, pointing at nodes */}
            <div
              className="lab4-how-dock"
              data-l4-zone="how"
              data-l4-scale="0.75"
              data-l4-yaw="-0.35"
              data-l4-point=".lab4-node"
              data-l4-mood="focus"
              aria-hidden
            />
          </header>
          <Lab4Schematic stack={STACK} process={PROCESS} />
        </section>

        {/* ------------------------------------------- 04 · services ladder */}
        <section className="lab4-section" id="services">
          <header className="lab4-sec-head with-dock">
            <div>
              <span className="lab4-coord" data-rv>
                04 — SERVICES
              </span>
              <h2 data-rv data-rv-d="1">
                รับครบสเปกตรัม
                <span className="soft"> จากหน้าเดียว ถึงทั้งแพลตฟอร์ม</span>
              </h2>
            </div>
            {/* zone marker 3 — perched on the headline, presenting the row
                the reader is on */}
            <div
              className="lab4-svc-dock"
              data-l4-zone="services"
              data-l4-scale="0.5"
              data-l4-yaw="-0.2"
              data-l4-pitch="0.08"
              data-l4-point=".lab4-svc"
              data-l4-perch="#services .lab4-sec-head h2"
              data-l4-float="0.2"
              data-l4-mood="focus"
              aria-hidden
            />
          </header>
          <Lab4Services items={SERVICES} />
        </section>

        {/* --------------------- 05-08 · standards + people (site sections,
            themed via the dark-token bridge; §14.3 requires them on Home) */}
        {/* 05-06 · the two product sections that stay (§14.3 + e2e contract):
            SDLC + the real team roster — both already speak the hairline/mono
            language; certificates live on /about (trust strip has the count) */}
        <div className="lab4-embed">
          <SdlcSection />
          <TeamSection idx="06 — Team" />
        </div>

        {/* --------------------------------------------------- 09 · closing */}
        <section className="lab4-section lab4-cta" id="contact">
          <span className="lab4-coord" data-rv>
            07 — CONTACT
          </span>
          <h2 data-rv data-rv-d="1">
            พร้อมเริ่มโปรเจกต์
            <br />
            แล้วหรือยัง?
          </h2>
          <div className="lab4-actions" data-rv data-rv-d="2">
            <a
              className="lab4-btn solid"
              href="https://fastwork.co"
              target="_blank"
              rel="noopener noreferrer"
            >
              จ้างผ่าน Fastwork <span className="arw">→</span>
            </a>
            <a className="lab4-btn ghost" href="/chat">
              ประเมินงบกับ AI
            </a>
          </div>
          <p className="lab4-cta-note" data-rv data-rv-d="3">
            ตอบไว · คุยกับ dev โดยตรง · ชำระผ่าน Fastwork ปลอดภัย
          </p>
          {/* zone marker 4 — the robot lands on the Fastwork button and
              points at the AI button: "or just ask me" */}
          <div
            className="lab4-cta-dock"
            data-l4-zone="contact"
            data-l4-scale="0.42"
            data-l4-float="0.18"
            data-l4-yaw="0.1"
            data-l4-point=".lab4-cta .lab4-btn.ghost"
            data-l4-perch=".lab4-cta .lab4-btn.solid"
            data-l4-mood="happy"
            aria-hidden
          />
          <a className="lab4-ai-chip lab4-glass" href="/chat" data-rv data-rv-d="2">
            <i aria-hidden />
            ผมคือ AI ตัวเดียวกับใน /chat — สงสัยอะไร ถามผมได้เลย
            <span className="arw">→</span>
          </a>
        </section>
      </main>

      {/* Oversized wordmark band (zone 5 — the robot peeks over it), then the
          site footer with the real link groups */}
      <div className="lab4-footer">
        <div className="lab4-shell">
          <div className="lab4-wordmark-wrap">
            <div className="lab4-wordmark" aria-hidden>
              T4 LABS
            </div>
            <div
              className="lab4-foot-dock"
              data-l4-zone="footer"
              data-l4-scale="0.9"
              data-l4-yaw="0.25"
              data-l4-pitch="0.18"
              aria-hidden
            />
          </div>
        </div>
      </div>
      <SiteFooter />

      <ChatButton />
      <RevealObserver />
      <SmoothScroll />
      <Lab4Fx />
      <Lab4RobotStageLazy />
    </div>
  );
}
