import Link from 'next/link';
import { createClient } from '@/lib/server';
import { deleteCertificate } from './actions';
import { CertForm } from './cert-form';

export default async function AdminCertificates() {
  const supabase = await createClient();
  const { data: certs } = await supabase
    .from('certificates')
    .select('id, title, issuer, issued_year, thumbnail, full_image, verify_url, is_featured, sort_order')
    .order('sort_order', { ascending: true });

  return (
    <div className="admin-page">
      <h1>ใบรับรอง</h1>
      <p className="t-meta">แสดงในหน้า /about และหน้าแรก (§4.7)</p>

      <div className="admin-form-card">
        <CertForm />
      </div>

      {certs && certs.length > 0 ? (
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>#</th>
                <th>ภาพย่อ</th>
                <th>หลักสูตร</th>
                <th>ผู้ออก</th>
                <th>ปี</th>
                <th>ไฟล์เต็ม</th>
                <th>หน้าแรก</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {certs.map((c) => (
                <tr key={c.id}>
                  <td className="t-meta">{c.sort_order}</td>
                  <td>
                    {c.thumbnail ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={c.thumbnail} alt="" className="admin-img-preview admin-img-preview-sm" />
                    ) : (
                      '—'
                    )}
                  </td>
                  <td>{c.title}</td>
                  <td className="t-meta">{c.issuer}</td>
                  <td>{c.issued_year ?? '—'}</td>
                  <td>
                    {c.full_image ? (
                      <a href={c.full_image} target="_blank" rel="noopener noreferrer">
                        เปิด ↗
                      </a>
                    ) : (
                      '—'
                    )}
                    {c.verify_url && (
                      <>
                        {' · '}
                        <a href={c.verify_url} target="_blank" rel="noopener noreferrer">
                          verify ↗
                        </a>
                      </>
                    )}
                  </td>
                  <td>{c.is_featured ? '★' : '—'}</td>
                  <td className="admin-row-actions">
                    <Link className="admin-edit" href={`/admin/certificates/${c.id}/edit`}>
                      แก้ไข
                    </Link>
                    <form action={deleteCertificate}>
                      <input type="hidden" name="id" value={c.id} />
                      <button type="submit" className="admin-del">ลบ</button>
                    </form>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="admin-empty">ยังไม่มีใบรับรอง</p>
      )}
    </div>
  );
}
