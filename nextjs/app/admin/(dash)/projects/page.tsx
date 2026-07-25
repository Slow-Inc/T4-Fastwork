import Link from 'next/link';
import { createClient } from '@/lib/server';
import { isMissingProjectColumnError } from '@/lib/projects-select';
import { deleteProject } from './actions';

type AdminProjectRow = {
  id: number;
  slug: string;
  title: string;
  is_featured: boolean | null;
  published_at: string | null;
  source?: string | null;
  gh_private?: boolean | null;
};

// Richest column set first, pre-migration shape second (#198). `gh_private` only exists once
// migration 0033 is authorized, and the code deploys before that — without this the whole
// admin projects list would come back empty with no visible reason.
const ADMIN_PROJECT_SELECTS = [
  'id, slug, title, is_featured, published_at, source, gh_private',
  'id, slug, title, is_featured, published_at, source',
];

/** Rows, or `null` when the query genuinely failed (which is not the same as "no projects"). */
async function loadAdminProjects(): Promise<AdminProjectRow[] | null> {
  const supabase = await createClient();
  for (const columns of ADMIN_PROJECT_SELECTS) {
    const { data, error } = await supabase
      .from('projects')
      .select(columns)
      .order('sort_order', { ascending: true });
    if (!error) return (data ?? []) as unknown as AdminProjectRow[];
    if (!isMissingProjectColumnError(error)) {
      console.error('[admin/projects] select failed', error);
      return null;
    }
  }
  console.error('[admin/projects] every select attempt was rejected');
  return null;
}

export default async function AdminProjects() {
  const projects = await loadAdminProjects();

  return (
    <div className="admin-page">
      <div className="admin-page-head">
        <h1>ผลงาน</h1>
        <div style={{ display: 'flex', gap: 8 }}>
          <Link href="/admin/projects/from-members" className="btn ghost">
            นำเข้าจาก repo สมาชิก
          </Link>
          <Link href="/admin/projects/from-org" className="btn ghost">
            นำเข้าจาก Slow-Inc
          </Link>
          <Link href="/admin/projects/new" className="btn">
            + เพิ่มผลงาน
          </Link>
        </div>
      </div>
      {projects === null ? (
        <p className="admin-empty">
          โหลดรายการผลงานไม่สำเร็จ — ลองรีเฟรชอีกครั้ง (ดูรายละเอียดใน log ของเซิร์ฟเวอร์)
        </p>
      ) : projects.length > 0 ? (
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>ชื่อ</th>
                <th>slug</th>
                <th>GitHub</th>
                <th>แนะนำ</th>
                <th>สถานะ</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {projects.map((p) => (
                <tr key={p.id}>
                  <td>{p.title}</td>
                  <td className="t-meta">{p.slug}</td>
                  <td className="t-meta">
                    {p.source !== 'github'
                      ? '—'
                      : typeof p.gh_private === 'boolean'
                        ? p.gh_private
                          ? 'Private'
                          : 'Public'
                        : '—'}
                  </td>
                  <td>{p.is_featured ? '★' : '—'}</td>
                  <td>{p.published_at ? 'เผยแพร่' : 'ฉบับร่าง'}</td>
                  <td className="admin-row-actions">
                    <Link href={`/admin/projects/${p.id}/edit`} className="admin-edit">
                      แก้ไข
                    </Link>
                    <form action={deleteProject}>
                      <input type="hidden" name="id" value={p.id} />
                      <button type="submit" className="admin-del">
                        ลบ
                      </button>
                    </form>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="admin-empty">ยังไม่มีผลงาน — กด “เพิ่มผลงาน” เพื่อเริ่ม</p>
      )}
    </div>
  );
}
