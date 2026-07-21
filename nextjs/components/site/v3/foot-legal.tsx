'use client';

import Link from 'next/link';
import { useLocale } from '@/i18n/locale-context';

/**
 * Slim legal strip for the home/lab4 footer. The lab4 composition's only footer
 * is the §14.10 oversized wordmark band (no production menu), but a live site
 * still needs its legal links reachable — this is the minimal, lab4-styled
 * compromise under the wordmark: © + Privacy + Terms, and deliberately NOT the
 * repeated nav menu that made the footer read like a second navbar.
 */
export function FootLegal() {
  const { locale } = useLocale();
  const en = locale === 'en';
  return (
    <footer className="lab4-legal">
      <div className="lab4-shell lab4-legal-row">
        <span className="lab4-legal-copy">© 2026 T4 Labs — Bangkok, TH</span>
        <span className="lab4-legal-links">
          <Link href="/privacy">{en ? 'Privacy' : 'นโยบายความเป็นส่วนตัว'}</Link>
          <Link href="/terms">{en ? 'Terms' : 'ข้อกำหนด'}</Link>
        </span>
      </div>
    </footer>
  );
}
