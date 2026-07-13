'use client';

import { useEffect } from 'react';
import type { Certificate } from '@/content/site';
import { isPdfUrl } from '@/lib/certificate-map';

/**
 * Pure preview body for a home/about certificate — the real image when we have one,
 * otherwise a typographic fallback card, plus PDF / verify links. No hooks, so it is
 * unit-testable on its own.
 */
export function CertCard({ cert }: { cert: Certificate }) {
  const previewSrc = cert.fullImage && !isPdfUrl(cert.fullImage) ? cert.fullImage : cert.thumbnail;
  return (
    <div className="cert-card">
      <div className="cert-preview" aria-hidden={!!previewSrc}>
        {previewSrc ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={previewSrc}
            alt={`${cert.title} — ${cert.issuer}`}
            loading="lazy"
            className="cert-preview-img"
          />
        ) : (
          <>
            <span className="t-meta">{cert.issuer}</span>
            <strong>{cert.title}</strong>
            <span className="cert-seal" />
          </>
        )}
      </div>
      {(( cert.fullImage && isPdfUrl(cert.fullImage)) || cert.verifyUrl) && (
        <div className="cert-modal-links">
          {cert.fullImage && isPdfUrl(cert.fullImage) && (
            <a className="btn ghost" href={cert.fullImage} target="_blank" rel="noopener noreferrer">
              ดูไฟล์ PDF ↗
            </a>
          )}
          {cert.verifyUrl && (
            <a
              className="t-meta cert-verify-link"
              href={cert.verifyUrl}
              target="_blank"
              rel="noopener noreferrer"
            >
              ตรวจสอบใบรับรอง ↗
            </a>
          )}
        </div>
      )}
    </div>
  );
}

/**
 * Modal certificate viewer for the home/about credentials section. Reuses the same
 * `.tm-modal` shell (and enter animation) as the per-person team lightbox so the two
 * behave identically.
 */
export function CertLightboxHome({
  cert,
  en,
  onClose,
}: {
  cert: Certificate | null;
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

  if (!cert) return null;

  return (
    <div
      className="tm-modal"
      role="dialog"
      aria-modal="true"
      aria-label={cert.title}
      onClick={onClose}
    >
      <div className="tm-modal-inner" onClick={(e) => e.stopPropagation()}>
        <button
          type="button"
          className="tm-modal-close"
          onClick={onClose}
          aria-label={en ? 'Close' : 'ปิด'}
        >
          ✕
        </button>
        <div className="tm-modal-body">
          <CertCard cert={cert} />
        </div>
        <div className="tm-modal-bar">
          <div className="tm-modal-cap">
            <span className="t-meta">{cert.issuer}</span> {cert.title}
          </div>
        </div>
      </div>
    </div>
  );
}
