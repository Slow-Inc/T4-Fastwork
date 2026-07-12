'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { hasSeenGreeting, markGreetingSeen } from '@/lib/first-visit';

const SHOW_AFTER_MS = 2500;

/**
 * First-visit greeting bubble (Requirement §5.4 / FR-01, FR-02) — offers a
 * tour of the AI assistant. Shown once per browser (localStorage), and never
 * on /chat itself since the user is already there.
 */
export function AiGreetingPopup() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (hasSeenGreeting(window.localStorage)) return;
    const timer = window.setTimeout(() => setOpen(true), SHOW_AFTER_MS);
    return () => window.clearTimeout(timer);
  }, []);

  function dismiss() {
    markGreetingSeen(window.localStorage);
    setOpen(false);
  }

  const suppressed = pathname?.startsWith('/chat') || pathname?.startsWith('/admin');
  if (!open || suppressed) return null;

  return (
    <div className="ai-greeting" role="dialog" aria-label="ผู้ช่วย T4 Labs AI">
      <button
        type="button"
        className="ai-greeting-close"
        aria-label="ปิด"
        onClick={dismiss}
      >
        ✕
      </button>
      <div className="ai-greeting-head">
        <span className="ai-greeting-avatar" aria-hidden="true" />
        <p>สวัสดีครับ ผมเป็นผู้ช่วย T4 Labs AI อยากให้ผมพาชมเว็บไหมครับ?</p>
      </div>
      <div className="ai-greeting-actions">
        <Link href="/chat" className="btn" onClick={dismiss}>
          เอาเลย พาชมหน่อย
        </Link>
        <Link href="/chat" className="btn ghost" onClick={dismiss}>
          คุยกับเรา
        </Link>
        <button type="button" className="ai-greeting-later" onClick={dismiss}>
          ไว้ก่อน
        </button>
      </div>
    </div>
  );
}
