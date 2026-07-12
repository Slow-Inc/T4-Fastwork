import Link from 'next/link';
import { MetricBand } from './metric-band';

/** Homepage hero (Requirement §4.1.2). */
export function Hero() {
  return (
    <header>
      <div className="h-top rv">
        <div className="h-avail t-label">
          <i />
          Open for Q3 · 2026
        </div>
        <div className="t-meta">Bangkok, TH — Full-Stack + AI</div>
      </div>

      <h1 className="rv">
        We build <em>SaaS</em>, web apps &amp; <em>AI</em> products that scale.
      </h1>

      <div className="h-lower">
        <div className="left rv">
          <p className="t-body">
            พาร์ตเนอร์ด้านวิศวกรรมซอฟต์แวร์สำหรับ Founder และองค์กร —{' '}
            <b>ตั้งแต่ Landing Page ไปจนถึงแพลตฟอร์มที่ซับซ้อนสูง</b>{' '}
            เริ่มเล็กแล้วสเกลต่อได้โดยไม่ต้องเปลี่ยนทีม
          </p>
        </div>
        <div className="right rv">
          <div className="t-meta">— ประสบการณ์รวม 20 ปี · ส่งมอบแล้ว 500+ โปรเจกต์</div>
          <div className="h-cta">
            <Link href="/contact" className="btn">
              Book a call <span>&rarr;</span>
            </Link>
            <Link href="/chat" className="btn ghost">
              Talk to our AI
            </Link>
          </div>
        </div>
      </div>

      <MetricBand />
    </header>
  );
}
