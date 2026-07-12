'use client';

import { useState } from 'react';
import Link from 'next/link';

/** Sticky liquid-glass nav (Requirement §4.1.1): real routes, search, language
 * switch and a mobile hamburger menu. */
const LINKS = [
  { href: '/projects', label: 'ผลงาน' },
  { href: '/#services', label: 'บริการ' },
  { href: '/about', label: 'เกี่ยวกับเรา' },
  { href: '/faq', label: 'FAQ' },
  { href: '/blog', label: 'บทความ' },
  { href: '/chat', label: 'AI' },
];

export function SiteNav() {
  const [open, setOpen] = useState(false);

  return (
    <nav>
      <Link href="/" className="brand">
        <i />
        T4&nbsp;Labs
      </Link>

      <div className="nlinks">
        {LINKS.map((l) => (
          <Link key={l.href} href={l.href} onClick={() => setOpen(false)}>
            {l.label}
          </Link>
        ))}
      </div>

      <div className="nav-actions">
        <form method="get" action="/projects" className="nav-search" role="search">
          <input
            type="search"
            name="q"
            placeholder="ค้นหา…"
            aria-label="ค้นหาผลงาน"
          />
        </form>
        <button type="button" className="lang-switch t-meta" aria-label="สลับภาษา">
          TH / EN
        </button>
        <Link href="/contact" className="btn nav-cta">
          ติดต่อเรา <span>&rarr;</span>
        </Link>
        <button
          type="button"
          className="nav-burger"
          aria-label="เมนู"
          aria-expanded={open}
          onClick={() => setOpen((o) => !o)}
        >
          <span />
          <span />
        </button>
      </div>

      {open && (
        <div className="nav-mobile">
          {LINKS.map((l) => (
            <Link key={l.href} href={l.href} onClick={() => setOpen(false)}>
              {l.label}
            </Link>
          ))}
          <Link href="/contact" className="btn" onClick={() => setOpen(false)}>
            ติดต่อเรา
          </Link>
        </div>
      )}
    </nav>
  );
}
