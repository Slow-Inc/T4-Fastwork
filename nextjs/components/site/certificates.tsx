import { certificates } from '@/content/site';

/** Homepage credentials table (Requirement §4.7). */
export function Certificates() {
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
            <div className="crow" key={`${c.issuer}-${i}`}>
              <span className="iss">{c.issuer}</span>
              <span className="ttl">{c.title}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
