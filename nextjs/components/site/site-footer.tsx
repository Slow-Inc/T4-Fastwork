'use client';

import Link from 'next/link';
import { useLocale } from '@/i18n/locale-context';

/** Footer (Requirement §4.1.10): repeated menu, extra + legal links, bilingual. */
export function SiteFooter() {
  const { locale } = useLocale();
  const en = locale === 'en';

  const menu = [
    { href: '/projects', label: en ? 'Work' : 'ผลงาน' },
    { href: '/#services', label: en ? 'Services' : 'บริการ' },
    { href: '/about', label: en ? 'About' : 'เกี่ยวกับเรา' },
    { href: '/blog', label: en ? 'Blog' : 'บทความ' },
    { href: '/faq', label: 'FAQ' },
    { href: '/chat', label: 'AI' },
  ];
  const extra = [
    { href: '/bw', label: en ? 'Partners' : 'พันธมิตร' },
    { href: '/pricing-guide', label: en ? 'Pricing' : 'แนวทางราคา' },
    { href: '/privacy', label: en ? 'Privacy' : 'นโยบายความเป็นส่วนตัว' },
    { href: '/terms', label: en ? 'Terms' : 'ข้อกำหนด' },
  ];

  return (
    <footer>
      <div className="footer-top">
        <div className="brand">
          <i />
          T4&nbsp;Labs
        </div>
        <nav className="footer-links">
          {menu.map((l) => (
            <Link key={l.href} href={l.href}>
              {l.label}
            </Link>
          ))}
        </nav>
        <nav className="footer-links footer-legal">
          {extra.map((l) => (
            <Link key={l.href} href={l.href}>
              {l.label}
            </Link>
          ))}
        </nav>
      </div>
      <div className="t-meta">© 2026 T4 Labs — Full-Stack + AI — Bangkok, TH</div>
    </footer>
  );
}
