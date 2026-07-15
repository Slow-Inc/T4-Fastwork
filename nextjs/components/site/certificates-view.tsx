import type { Certificate } from '@/content/site';
import { staggerDelay } from '@/lib/stagger';

/**
 * Presentational credentials section (§4.7) — intro + clickable rows. Pure and
 * unit-testable (no hooks, no server-only imports); the click-to-zoom lightbox lives
 * in the client `CertificatesGallery`, which passes `onOpen`. Rows cascade in on
 * scroll, reusing the same slide-down rhythm as the FAQ list.
 */
/** How many credentials lead before the rest collapse behind "see more" (#50). */
const CERT_LIMIT = 9;

export function CertificatesView({
  certificates,
  onOpen,
}: {
  certificates: Certificate[];
  onOpen?: (index: number) => void;
}) {
  const row = (c: Certificate, i: number) => (
    <button
      type="button"
      className="crow rv rv-down"
      key={`${c.issuer}-${i}`}
      onClick={() => onOpen?.(i)}
      style={{ transitionDelay: staggerDelay(i) }}
    >
      <span className="iss">
        {c.issuerLogo && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={c.issuerLogo} alt="" loading="lazy" className="cert-issuer-logo" />
        )}
        {c.issuer}
      </span>
      <span className="ttl">
        {c.title}
        {c.issuedYear && <span className="t-meta cert-year"> · {c.issuedYear}</span>}
      </span>
      <span className="crow-view t-meta">ดูใบเต็ม →</span>
    </button>
  );

  const head = certificates.slice(0, CERT_LIMIT);
  const rest = certificates.slice(CERT_LIMIT);

  return (
    <section id="certs" className="section">
      <div className="cert-wrap">
        <div className="rv">
          <div className="t-idx">05 — Credentials</div>
          <h2>Certified, and still learning.</h2>
          <p className="t-body">
            ทีมสะสมใบรับรองด้าน AI, Data และ Security ต่อเนื่อง —
            เพราะโจทย์ลูกค้าไม่เคยหยุดนิ่ง
          </p>
        </div>
        <div className="ctable">
          {head.map((c, i) => row(c, i))}
          {rest.length > 0 && (
            <details className="cert-more">
              <summary className="cert-more-summary t-meta">
                + ดูใบรับรองเพิ่มเติมอีก {rest.length} ใบ
              </summary>
              {rest.map((c, i) => row(c, i + CERT_LIMIT))}
            </details>
          )}
        </div>
      </div>
    </section>
  );
}
