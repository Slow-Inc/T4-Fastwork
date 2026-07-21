import { V3Shell } from '@/components/site/v3/v3-shell';
import { Lab4RobotStageLazy } from '@/components/site/lab4/lab4-robot-stage-lazy';
import { Lab4ResetButton } from '@/components/site/lab4/lab4-reset-button';
import { Lab4SolutionSelector } from '@/components/site/lab4/lab4-solution-selector';
import { Lab4Schematic } from '@/components/site/lab4/lab4-schematic';
import { Lab4Services } from '@/components/site/lab4/lab4-services';
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
  return (
    <V3Shell blueprint="visible" robot="live" siteFooter={false} defaultTheme="light">
      <main className="lab4-shell">
        {/* ------------------------------------------------ 00 · hero thesis
            Storytelling zone 1, ChainGPT-labs structure: the kinetic band IS
            the only display-scale type (one dominant per viewport, §14.0);
            below it a Swiss table band — mono copy · robot · meta cells —
            closed by a full-width trust strip. */}
        {/* ------------------------------------------------ 00 · hero thesis
            "Swiss Calm Thesis" (docs/design/2026-07-22-…-northstar): the ONE
            bold move is the robot doing a JOB — translating a non-technical
            client's plain-language brief into scope / budget / next-steps.
            No kinetic marquee, no numbered eyebrow, no hero-metric strip. */}
        <section className="lab4-hero">
          <div className="lab4-hero-grid">
            <div className="lab4-hero-cell copy">
              <h1 className="lab4-h1" data-rv>
                ไม่ต้องพูดภาษาคอม
                <br />
                ก็สร้าง<em>ของจริง</em>ได้
              </h1>
              <p className="lab4-lead" data-rv data-rv-d="1">
                เล่าเป้าหมายด้วยคำของคุณ — เราแปลงให้เป็นขอบเขตงาน งบประมาณ
                และแผนสร้างเว็บไซต์หรือแอปที่เข้าใจง่าย
              </p>
              {/* CTA hierarchy (clink 2026-07-22): the AI estimate is the
                  low-friction first step that matches the "tell us in your
                  words" thesis; Fastwork is the trusted transaction path. */}
              <div className="lab4-actions" data-rv data-rv-d="2">
                <a className="lab4-btn solid" href="/chat">
                  ประเมินงานกับ AI <span className="arw">→</span>
                </a>
                <a
                  className="lab4-btn ghost"
                  href="https://fastwork.co"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  ดูโปรไฟล์ Fastwork <span className="arw">↗</span>
                </a>
              </div>
              <p className="lab4-scope" data-rv data-rv-d="3">
                เว็บไซต์ · แอปพลิเคชัน · AI Product
              </p>
            </div>

            {/* the robot's workbench: client brief → robot (it translates) →
                the output the client gets. The robot lives in the hero zone
                marker; the surrounding DOM gives it its job. */}
            <div className="lab4-workbench">
              <div className="lab4-brief" data-rv>
                <span className="lab4-brief-k">โจทย์จากลูกค้า</span>
                <p>“อยากมีเว็บรับจองร้าน ใช้ง่าย ลูกค้าจองเองได้”</p>
              </div>
              <div
                className="lab4-stage"
                data-l4-zone="hero"
                data-l4-grab
                data-l4-scale="0.6"
              >
                <div className="lab4-scene-fallback" aria-hidden />
                <p className="lab4-stage-hint">
                  ลากเพื่อหมุนโมเดล
                  <Lab4ResetButton />
                </p>
              </div>
              <div className="lab4-output" data-rv data-rv-d="2">
                <span className="lab4-output-k">สิ่งที่คุณจะได้หลังเล่าโจทย์</span>
                <ul>
                  <li>ขอบเขตงาน</li>
                  <li>ช่วงงบประมาณ</li>
                  <li>ขั้นตอนถัดไป</li>
                </ul>
              </div>
            </div>
          </div>

          {/* proof — one restrained line at body scale, not a hero-metric strip */}
          <p className="lab4-proof" data-rv>
            ทำงานจริง {stats.years} ปี · ส่งมอบ {stats.projects}+ โปรเจกต์ ·
            ใบรับรองทีม {stats.certs} รายการ —{' '}
            <a href="/projects">
              ดูผลงานที่ตรวจสอบได้ <span className="arw">→</span>
            </a>
          </p>
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
          {/* z-index:3 lifts the buttons ABOVE the fixed robot canvas (z:2, the
              §14.2.1 seam layer) so the live robot travelling to the contact zone
              sits BEHIND the Fastwork button and plays with it — peeking over and
              pointing at the AI button (dev directive 2026-07-21: "model ที่เลื่อน
              ลงมาที่ปุ่ม อยู่ด้านหลัง Button แบบเล่นกับปุ่ม"). */}
          <div className="lab4-actions lab4-actions-front" data-rv data-rv-d="2">
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
          {/* zone marker 4 — the live robot slides down and perches at the
              Fastwork button, rendered BEHIND it (buttons raised to z:3), and
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

      <Lab4RobotStageLazy />
    </V3Shell>
  );
}
