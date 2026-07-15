'use client';

import { useEffect, useState } from 'react';

/**
 * In-place website preview (vision item, deferred from #27) — opens the project's live
 * site in a sandboxed iframe overlay on top of ours instead of navigating away. Some
 * sites send X-Frame-Options / CSP frame-ancestors and won't embed, so an "open in a new
 * tab" link is always offered as the fallback. `url` comes from the admin-set live_url.
 */
export function WebsitePreview({
  url,
  title,
  en,
}: {
  url: string;
  title: string;
  en: boolean;
}) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [open]);

  return (
    <>
      <button type="button" className="btn ghost" onClick={() => setOpen(true)}>
        {en ? 'Preview ▦' : 'ดูตัวอย่าง ▦'}
      </button>
      {open && (
        <div
          className="tm-modal"
          role="dialog"
          aria-modal="true"
          aria-label={`${title} — ${en ? 'website preview' : 'ตัวอย่างเว็บ'}`}
          onClick={() => setOpen(false)}
        >
          <div
            className="tm-modal-inner"
            onClick={(e) => e.stopPropagation()}
            style={{ width: 'min(1100px, 94vw)' }}
          >
            <button
              type="button"
              className="tm-modal-close"
              onClick={() => setOpen(false)}
              aria-label={en ? 'Close' : 'ปิด'}
            >
              ✕
            </button>
            <iframe
              src={url}
              title={title}
              sandbox="allow-scripts allow-same-origin allow-popups allow-forms"
              loading="lazy"
              style={{
                width: '100%',
                height: '72vh',
                border: 0,
                borderRadius: 8,
                background: '#fff',
              }}
            />
            <div className="tm-modal-bar">
              <div className="tm-modal-cap">
                <span className="t-meta">{en ? 'Preview' : 'ตัวอย่าง'}</span> {title}
              </div>
              <div className="tm-modal-dl">
                <a href={url} target="_blank" rel="noopener noreferrer">
                  {en ? 'Open in a new tab ↗' : 'เปิดในแท็บใหม่ ↗'}
                </a>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
