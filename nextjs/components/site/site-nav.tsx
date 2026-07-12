'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useLocale } from '@/i18n/locale-context';
import th from '@/messages/th.json';
import en from '@/messages/en.json';

/** Sticky liquid-glass nav (Requirement §4.1.1): real routes, search, a
 * client-side TH/EN switch (keeps pages static), and a mobile hamburger. */
export function SiteNav() {
  const { locale, setLocale } = useLocale();
  const [open, setOpen] = useState(false);
  const t = (locale === 'en' ? en : th).nav;

  const links = [
    { href: '/projects', label: t.work },
    { href: '/#services', label: t.services },
    { href: '/about', label: t.about },
    { href: '/faq', label: t.faq },
    { href: '/blog', label: t.blog },
    { href: '/chat', label: t.ai },
  ];

  return (
    <nav>
      <Link href="/" className="brand">
        <i />
        T4&nbsp;Labs
      </Link>

      <div className="nlinks">
        {links.map((l) => (
          <Link key={l.href} href={l.href} onClick={() => setOpen(false)}>
            {l.label}
          </Link>
        ))}
      </div>

      <div className="nav-actions">
        <form method="get" action="/projects" className="nav-search" role="search">
          <input type="search" name="q" placeholder={t.search} aria-label={t.search} />
        </form>
        <button
          type="button"
          className="lang-switch t-meta"
          aria-label="Switch language"
          onClick={() => setLocale(locale === 'th' ? 'en' : 'th')}
        >
          {locale === 'th' ? 'TH / en' : 'th / EN'}
        </button>
        <Link href="/contact" className="btn nav-cta">
          {t.contact} <span>&rarr;</span>
        </Link>
        <button
          type="button"
          className="nav-burger"
          aria-label="Menu"
          aria-expanded={open}
          onClick={() => setOpen((o) => !o)}
        >
          <span />
          <span />
        </button>
      </div>

      {open && (
        <div className="nav-mobile">
          {links.map((l) => (
            <Link key={l.href} href={l.href} onClick={() => setOpen(false)}>
              {l.label}
            </Link>
          ))}
          <Link href="/contact" className="btn" onClick={() => setOpen(false)}>
            {t.contact}
          </Link>
        </div>
      )}
    </nav>
  );
}
