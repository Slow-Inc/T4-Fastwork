'use client';

import Link from 'next/link';
import { useT } from '@/i18n/locale-context';

/** /lab footer — link columns over a giant faint "T4 LABS" wordmark (the
 *  ChainGPT big-wordmark footer). Pure/presentational. */
export function LabFooter() {
  const discover = useT('เมนู', 'Discover');
  const legal = useT('ข้อกำหนด', 'Legal');
  return (
    <footer className="lab-footer">
      <div className="lab-footer-cols">
        <div className="lab-footer-brand">
          <span className="lab-footer-logo">
            <i />
            T4 Labs
          </span>
          <p className="lab-footer-tag">
            {useT(
              'พาร์ตเนอร์ด้านวิศวกรรมซอฟต์แวร์ — Bangkok, TH',
              'A product engineering partner — Bangkok, TH',
            )}
          </p>
        </div>
        <nav className="lab-footer-col" aria-label={discover}>
          <span className="lab-footer-head">{discover}</span>
          <Link href="/projects">{useT('ผลงาน', 'Work')}</Link>
          <Link href="/about">{useT('เกี่ยวกับเรา', 'About')}</Link>
          <Link href="/chat">{useT('คุยกับ AI', 'AI')}</Link>
          <Link href="/contact">{useT('ติดต่อ', 'Contact')}</Link>
        </nav>
        <nav className="lab-footer-col" aria-label={legal}>
          <span className="lab-footer-head">{legal}</span>
          <Link href="/privacy">{useT('ความเป็นส่วนตัว', 'Privacy')}</Link>
          <Link href="/terms">{useT('ข้อกำหนดการใช้งาน', 'Terms')}</Link>
        </nav>
      </div>
      <div className="lab-wordmark" aria-hidden>
        T4 LABS
      </div>
    </footer>
  );
}
