import { createClient } from '@/lib/server';
import { setMemberCertStatus } from './actions';

interface CertRow {
  id: number;
  issuer: string;
  title: string;
  status: string;
  members: { handle: string; slug: string } | null;
}

/**
 * Admin approval queue (Epic C / C4 + C6) — member-authored certificates awaiting
 * review. Admin reads all rows via the `is_app_admin()` SELECT policy; approving flips
 * status draft->published (the SECURITY DEFINER RPC), publishing it to the member's
 * public profile. Drafts lead; published rows can be pulled back to draft.
 */
export default async function ApprovalsPage() {
  const supabase = await createClient();
  const { data } = await supabase
    .from('member_certificates')
    .select('id, issuer, title, status, members(handle, slug)')
    .order('status', { ascending: true })
    .order('id', { ascending: false });
  const certs = (data ?? []) as unknown as CertRow[];
  const drafts = certs.filter((c) => c.status === 'draft');
  const published = certs.filter((c) => c.status === 'published');

  return (
    <div className="admin-page">
      <h1>อนุมัติเนื้อหาสมาชิก</h1>
      <p className="t-meta">
        ใบรับรองที่สมาชิกเพิ่มเอง — อนุมัติเพื่อแสดงบนโปรไฟล์สาธารณะ
      </p>

      <h2 className="t-idx" style={{ marginTop: 24 }}>
        รออนุมัติ ({drafts.length})
      </h2>
      {drafts.length === 0 ? (
        <p className="admin-empty">ไม่มีรายการรออนุมัติ</p>
      ) : (
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>สมาชิก</th>
                <th>ผู้ออก</th>
                <th>ใบรับรอง</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {drafts.map((c) => (
                <tr key={c.id}>
                  <td>{c.members?.handle ?? '—'}</td>
                  <td>{c.issuer}</td>
                  <td>{c.title}</td>
                  <td className="admin-row-actions">
                    <form action={setMemberCertStatus}>
                      <input type="hidden" name="id" value={c.id} />
                      <input type="hidden" name="status" value="published" />
                      <input type="hidden" name="slug" value={c.members?.slug ?? ''} />
                      <button type="submit" className="btn">
                        อนุมัติ
                      </button>
                    </form>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <h2 className="t-idx" style={{ marginTop: 32 }}>
        เผยแพร่แล้ว ({published.length})
      </h2>
      {published.length === 0 ? (
        <p className="admin-empty">ยังไม่มีที่เผยแพร่</p>
      ) : (
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>สมาชิก</th>
                <th>ผู้ออก</th>
                <th>ใบรับรอง</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {published.map((c) => (
                <tr key={c.id}>
                  <td>{c.members?.handle ?? '—'}</td>
                  <td>{c.issuer}</td>
                  <td>{c.title}</td>
                  <td className="admin-row-actions">
                    <form action={setMemberCertStatus}>
                      <input type="hidden" name="id" value={c.id} />
                      <input type="hidden" name="status" value="draft" />
                      <input type="hidden" name="slug" value={c.members?.slug ?? ''} />
                      <button type="submit" className="admin-del">
                        ถอนกลับเป็นร่าง
                      </button>
                    </form>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
