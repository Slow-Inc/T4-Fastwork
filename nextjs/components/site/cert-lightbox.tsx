'use client';

import { useEffect } from 'react';
import type { TeamCertificate } from '@/content/site';

/** Modal certificate viewer — zoomable display image + original PDF/PNG downloads. */
export function CertLightbox({
  cert,
  en,
  onClose,
}: {
  cert: TeamCertificate | null;
  en: boolean;
  onClose: () => void;
}) {
  useEffect(() => {
    if (!cert) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [cert, onClose]);

  if (!cert || !cert.asset) return null;

  return (
    <div className="tm-modal" role="dialog" aria-modal="true" aria-label={cert.title} onClick={onClose}>
      <div className="tm-modal-inner" onClick={(e) => e.stopPropagation()}>
        <button type="button" className="tm-modal-close" onClick={onClose} aria-label={en ? 'Close' : 'ปิด'}>
          ✕
        </button>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img className="tm-modal-img" src={cert.asset.webp} alt={`${cert.title} — ${cert.issuer}`} />
        <div className="tm-modal-bar">
          <div className="tm-modal-cap">
            <span className="t-meta">{cert.issuer}</span> {cert.title}
          </div>
          <div className="tm-modal-dl">
            {cert.asset.pdf && (
              <a href={cert.asset.pdf} download target="_blank" rel="noopener noreferrer">
                PDF
              </a>
            )}
            {cert.asset.img && (
              <a href={cert.asset.img} download target="_blank" rel="noopener noreferrer">
                {cert.asset.img.toLowerCase().endsWith('.jpg') ? 'JPG' : 'PNG'}
              </a>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
