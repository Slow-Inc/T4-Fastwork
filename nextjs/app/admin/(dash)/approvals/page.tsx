import { createClient } from '@/lib/server';
import { setMemberCertStatus, setBlogStatus } from './actions';

interface CertRow {
  id: number;
  issuer: string;
  title: string;
  status: string;
  members: { handle: string; slug: string } | null;
}

interface PostRow {
  id: number;
  title: string;
  slug: string;
  published_at: string | null;
  members: { handle: string } | null;
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

  // Member-authored blog posts (author_id set) awaiting/holding publication.
  const { data: postData } = await supabase
    .from('blog_posts')
    .select('id, title, slug, published_at, members:author_id(handle)')
    .not('author_id', 'is', null)
    .order('id', { ascending: false });
  const posts = (postData ?? []) as unknown as PostRow[];
  const postDrafts = posts.filter((p) => p.published_at == null);
  const postPublished = posts.filter((p) => p.published_at != null);

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

      <h2 className="t-idx" style={{ marginTop: 40 }}>
        บทความสมาชิก — รออนุมัติ ({postDrafts.length})
      </h2>
      {postDrafts.length === 0 ? (
        <p className="admin-empty">ไม่มีบทความรออนุมัติ</p>
      ) : (
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>ผู้เขียน</th>
                <th>หัวข้อ</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {postDrafts.map((p) => (
                <tr key={p.id}>
                  <td>{p.members?.handle ?? '—'}</td>
                  <td>{p.title}</td>
                  <td className="admin-row-actions">
                    <a className="admin-edit" href={`/admin/blog/${p.id}/edit`}>
                      ตรวจ/แก้
                    </a>
                    <form action={setBlogStatus}>
                      <input type="hidden" name="id" value={p.id} />
                      <input type="hidden" name="publish" value="1" />
                      <button type="submit" className="btn">
                        เผยแพร่
                      </button>
                    </form>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {postPublished.length > 0 && (
        <>
          <h2 className="t-idx" style={{ marginTop: 32 }}>
            บทความสมาชิก — เผยแพร่แล้ว ({postPublished.length})
          </h2>
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>ผู้เขียน</th>
                  <th>หัวข้อ</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {postPublished.map((p) => (
                  <tr key={p.id}>
                    <td>{p.members?.handle ?? '—'}</td>
                    <td>{p.title}</td>
                    <td className="admin-row-actions">
                      <form action={setBlogStatus}>
                        <input type="hidden" name="id" value={p.id} />
                        <input type="hidden" name="publish" value="0" />
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
        </>
      )}
    </div>
  );
}
