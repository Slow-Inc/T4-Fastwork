import Link from 'next/link';
import { createClient } from '@/lib/server';
import { deleteProject } from './actions';

export default async function AdminProjects() {
  const supabase = await createClient();
  const { data: projects } = await supabase
    .from('projects')
    .select('id, slug, title, is_featured, published_at')
    .order('sort_order', { ascending: true });

  return (
    <div className="admin-page">
      <div className="admin-page-head">
        <h1>ผลงาน</h1>
        <Link href="/admin/projects/new" className="btn">
          + เพิ่มผลงาน
        </Link>
      </div>
      {projects && projects.length > 0 ? (
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>ชื่อ</th>
                <th>slug</th>
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
                  <td>{p.is_featured ? '★' : '—'}</td>
                  <td>{p.published_at ? 'เผยแพร่' : 'ฉบับร่าง'}</td>
                  <td>
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
