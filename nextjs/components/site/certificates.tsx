import { getCertificates } from '@/lib/certificates-repo';
import type { Certificate } from '@/content/site';

/**
 * Presentational credentials section with a click-to-zoom lightbox (§4.7). The
 * lightbox is CSS-only (`:target`) so this stays a server component. Kept as a
 * pure view (takes data) so it is unit-testable; `Certificates` fetches.
 */
export function CertificatesView({ certificates }: { certificates: Certificate[] }) {
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
        <div className="ctable rv">
          {certificates.map((c, i) => (
            <a className="crow" key={`${c.issuer}-${i}`} href={`#cert-${i}`}>
              <span className="iss">{c.issuer}</span>
              <span className="ttl">{c.title}</span>
              <span className="crow-view t-meta">ดูใบเต็ม →</span>
            </a>
          ))}
        </div>
      </div>

      {certificates.map((c, i) => (
        <div className="cert-modal" id={`cert-${i}`} key={`modal-${i}`}>
          <a className="cert-modal-bg" href="#certs" aria-label="ปิด" />
          <div className="cert-modal-card">
            <div className="cert-preview" aria-hidden="true">
              <span className="t-meta">{c.issuer}</span>
              <strong>{c.title}</strong>
              <span className="cert-seal" />
            </div>
            <a className="cert-modal-close" href="#certs" aria-label="ปิด">
              ✕
            </a>
          </div>
        </div>
      ))}
    </section>
  );
}

/** Fetches certificates (DB with static fallback) and renders the view. */
export async function Certificates() {
  const certificates = await getCertificates();
  return <CertificatesView certificates={certificates} />;
}
