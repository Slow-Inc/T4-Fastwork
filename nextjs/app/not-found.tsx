import Link from 'next/link';
import Image from 'next/image';
import { V3Shell } from '@/components/site/v3/v3-shell';

/**
 * 404 — the one page every site ships and few design. §14.2.1 gives the robot a
 * job here: it shrugs, which is the honest reaction, and then the page does the
 * useful thing and offers the three doors people actually want.
 */
export default function NotFound() {
  return (
    <V3Shell blueprint="quiet" robot="none">
      <main className="lab4-shell">
        <section className="v3-404">
          <div className="v3-404-copy">
            <span className="lab4-coord">ERROR — 404</span>
            <h1>
              ไม่เจอหน้านี้
              <span className="soft"> แต่เจอทางออกให้แล้ว</span>
            </h1>
            <p className="lab4-lead">
              ลิงก์อาจเก่า พิมพ์ผิด หรือหน้านั้นถูกย้ายไปแล้ว — ลองเริ่มจากตรงนี้
            </p>
            <div className="lab4-actions">
              <Link className="lab4-btn solid" href="/">
                กลับหน้าแรก <span className="arw">→</span>
              </Link>
              <Link className="lab4-btn ghost" href="/projects">
                ดูผลงาน
              </Link>
              <Link className="lab4-btn ghost" href="/chat">
                ถาม AI ว่าหาอะไรอยู่
              </Link>
            </div>
          </div>
          <Image
            className="v3-404-bot"
            src="/brand/t4bot-shrug.webp"
            alt="T4 Bot ยักไหล่"
            width={512}
            height={512}
            priority
          />
        </section>
      </main>
    </V3Shell>
  );
}
