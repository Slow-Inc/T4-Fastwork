'use client';

import { Fragment } from 'react';
import { processNodes, processConns, processSteps } from '@/content/site';
import { useLocale } from '@/i18n/locale-context';

/** Presentational schematic — pure, unit-testable. */
export function ProcessSchematicView({ en }: { en: boolean }) {
  return (
    <section id="process" className="section">
      <div className="proc-head rv">
        <div className="t-idx">04 — Process</div>
        <h2>How we think about your system.</h2>
        <p className="t-body">
          {en
            ? 'Before the first line of code we design the architecture — data flow, where it must scale, and security first. Below is the path of a single request through a system we actually built.'
            : 'ก่อนเขียนโค้ดบรรทัดแรก เราออกแบบสถาปัตยกรรมให้เห็น data flow, จุดที่ต้องสเกล และความปลอดภัยก่อน — ด้านล่างคือเส้นทางของหนึ่ง request บนระบบที่เราสร้างจริง'}
        </p>
      </div>

      <div className="sys rv">
        {processNodes.map((n, i) => (
          <Fragment key={n.name}>
            <div className="node">
              <span className="ni">{n.index}</span>
              <span className="nn">{n.name}</span>
              <span className="nr">{n.role}</span>
            </div>
            {i < processConns.length && (
              <div className="conn">
                <span className="cl">{processConns[i]!.label}</span>
                <span className="cln" />
              </div>
            )}
          </Fragment>
        ))}
      </div>

      <div className="proc-steps rv">
        {processSteps.map((step, i) => (
          <div className="st" key={step}>
            <div className="k">{String(i + 1).padStart(2, '0')}</div>
            <div className="v">{step}</div>
          </div>
        ))}
      </div>
    </section>
  );
}

/**
 * "How we build" — a hand-built system schematic of a real request path
 * (Requirement §4.1.7 / §14.11). No stock imagery; CSS/type/line only.
 */
export function ProcessSchematic() {
  const { locale } = useLocale();
  return <ProcessSchematicView en={locale === 'en'} />;
}
