import { V3Shell } from '@/components/site/v3/v3-shell';
import { Lab4RobotStageLazy } from '@/components/site/lab4/lab4-robot-stage-lazy';
import { Lab4ResetButton } from '@/components/site/lab4/lab4-reset-button';
import { Lab4SolutionSelector } from '@/components/site/lab4/lab4-solution-selector';
import { Lab4Schematic } from '@/components/site/lab4/lab4-schematic';
import { Lab4Services } from '@/components/site/lab4/lab4-services';
import { KineticMarquee } from '@/components/site/lab/kinetic-marquee';
import { SOLUTIONS, STACK, PROCESS, SERVICES } from '@/content/home-v3';
import { getSiteStats } from '@/lib/site-stats';

/**
 * The /lab4 v3 composition — the single source for BOTH the live home
 * (`app/page.tsx`) and `/lab4` (dev directive 2026-07-20: "ใช้ lab4 เป็นหน้า home").
 * Rendering one component from both routes is what makes them identical by
 * construction; the previous home lives on /legacy-2. Do not fork this file per
 * route — change it and both move together.
 *
 * The only sanctioned change to the prototype's composition is its chrome: the
 * production `SiteNav` replaced the lab4 glass bar (the prototype's anchor-only
 * nav was a dead end on a live home), with the theme switch kept beside it.
 */
export async function Lab4Home() {
  // the trust strip is a load-bearing claim, so it reads the live counts (the
  // prototype's TRUST constant is a placeholder that understated the team:
  // 5 ปี / 7 certs vs the real 7 / 24)
  const stats = await getSiteStats();
  const trust = [
    { n: String(stats.years), unit: 'ปี', label: 'ประสบการณ์ทีม' },
    { n: String(stats.projects), unit: '+', label: 'โปรเจกต์ที่ส่งมอบ' },
    { n: String(stats.certs), unit: '', label: 'ใบรับรองของทีม' },
  ];
  return (
    <V3Shell blueprint="visible" robot="live">
      <main className="lab4-shell">
        {/* ------------------------------------------------ 00 · hero thesis
            Storytelling zone 1, ChainGPT-labs structure: the kinetic band IS
            the only display-scale type (one dominant per viewport, §14.0);
            below it a Swiss table band — mono copy · robot · meta cells —
            closed by a full-width trust strip. */}
        <section className="lab4-hero">
          {/* display headline = the marquee itself; decorative (real h1 below) */}
          <div className="lab4-marquee">
            <KineticMarquee text="BUILDING TOMORROW —" />
          </div>

          <div className="lab4-hero-grid">
            <div className="lab4-hero-cell copy">
              <span className="lab4-coord" data-rv>
                <i aria-hidden />
                00 — POSITIONING
              </span>
              {/* fix1 "Recommended Positioning": the old headline promised
                  unlimited scope ("อยากมีเว็บแบบไหน เราสร้างได้"). This states
                  range + engineering standard + the ability to grow with the
                  customer, which is what a partner claims. */}
              <h1 className="lab4-h1" data-rv data-rv-d="1">
                ผลิตภัณฑ์ดิจิทัลที่<em>โตต่อได้</em>
                <br />
                ตั้งแต่เว็บแรก ถึงระบบที่ธุรกิจใช้ทุกวัน
              </h1>
              <p className="lab4-lead" data-rv data-rv-d="2">
                เราออกแบบและสร้างเว็บไซต์ แอปพลิเคชัน และผลิตภัณฑ์ AI
                ด้วยมาตรฐานวิศวกรรมเดียวกันทุกสเกล — คุยกับ dev โดยตรง
                ไม่ต้องรู้ศัพท์เทคนิค
              </p>
              {/* fix1 CTA hierarchy: ONE primary pointing at the real
                  transaction channel, one visibly subordinate secondary */}
              <div className="lab4-actions" data-rv data-rv-d="3">
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
            </div>

            {/* zone marker 1 — the robot's home cell; grab = drag-to-rotate */}
            <div
              className="lab4-stage"
              data-l4-zone="hero"
              data-l4-grab
              data-l4-scale="0.62"
            >
              <div className="lab4-scene-fallback" aria-hidden />
              {/* fix1: "DRAG TO ROTATE" shouted an instruction nobody asked
                  for. The hint is quiet and only surfaces on pointer intent. */}
              <p className="lab4-stage-hint">
                ลากเพื่อหมุนโมเดล
                <Lab4ResetButton />
              </p>
            </div>

            {/* fix1 P0.3: the meta column used to publish prototype telemetry
                (model file size, "R3F", "zone travel", "dual theme") — debug
                output on a page whose job is to read as a serious engineering
                partner. It now carries what a client actually needs to know
                before hiring: how the engagement works. */}
            <div className="lab4-hero-cell meta">
              <div className="lab4-meta-block" data-rv>
                <span className="k">ทีม</span>
                <span className="v">
                  <i className="dot" />
                  Bangkok, TH · Full-stack + AI
                </span>
              </div>
              <div className="lab4-meta-block" data-rv data-rv-d="2">
                <span className="k">การทำงาน</span>
                <span className="v">คุยกับ dev โดยตรง</span>
              </div>
              <div className="lab4-meta-block grow" data-rv data-rv-d="3">
                <span className="k">การจ้างงาน</span>
                <span className="v">ผ่าน Fastwork · คุ้มครองทั้งสองฝั่ง</span>
              </div>
            </div>
          </div>

          {/* trust strip — the ChainGPT partners-row slot, filled with proof */}
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

        {/* ------------------------------------------- 02 · system schematic
            Storytelling zone 2: the robot docks beside the real request path
            and the AI node opens the live chatbot (§14.18) */}
        <section className="lab4-section" id="how">
          <header className="lab4-sec-head with-dock">
            <div>
              <span className="lab4-coord" data-rv>
                02 — HOW WE BUILD
              </span>
              <h2 data-rv data-rv-d="1">
                สถาปัตยกรรมชุดเดียวกับที่หน้านี้รันอยู่
              </h2>
              <p className="lab4-sec-note" data-rv data-rv-d="2">
                ไม่ใช่ diagram ประกอบ — นี่คือ request path จริงของระบบเรา
                กดที่ node AI เพื่อเปิดแชตบอทตัวจริงได้เลย
              </p>
            </div>
            {/* zone marker 2 — the robot tours the stack, pointing at the
                node you hover (or the one nearest the viewport centre) */}
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

        {/* ------------------------------------------- 03 · services ladder
            Storytelling zone 3: the robot escorts the reader down the
            spectrum ladder (§14.2.1 — the recommended 4-zone set) */}
        <section className="lab4-section" id="services">
          <header className="lab4-sec-head with-dock">
            <div>
              <span className="lab4-coord" data-rv>
                03 — SERVICES
              </span>
              <h2 data-rv data-rv-d="1">
                รับครบสเปกตรัม
                <span className="soft"> จากหน้าเดียว ถึงทั้งแพลตฟอร์ม</span>
              </h2>
            </div>
            {/* zone marker 3 — the robot PERCHES on the headline itself and
                presents the ladder row you're reading (hover = instant) */}
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

        {/* --------------------------------------------------- 04 · closing
            Storytelling zone: the robot perches on the headline and points
            down at the hire buttons — and since it IS the same character as
            the AI assistant (§14.2.1), the chip invites you to just ask. */}
        <section className="lab4-section lab4-cta" id="contact">
          <span className="lab4-coord" data-rv>
            04 — CONTACT
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
          {/* zone marker 4 — the robot lands ON the Fastwork button (the
              money path) and points at the AI button: "or just ask me" */}
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

      <Lab4RobotStageLazy />
    </V3Shell>
  );
}
