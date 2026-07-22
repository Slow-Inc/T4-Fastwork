import Link from 'next/link';
import { createClient } from '@/lib/server';
import { importMemberRepo, importAllMemberRepos } from '../actions';
import { slugifyRepo } from '@/lib/member-repo-import';

interface Row {
  id: number;
  name: string;
  url: string;
  year: number | null;
  members:
    | { handle: string | null }
    | { handle: string | null }[]
    | null;
}

function handleOf(r: Row): string {
  const m = Array.isArray(r.members) ? r.members[0] : r.members;
  return m?.handle ?? '—';
}

/**
 * Import member-selected repos into the main showcase (/projects). Lists every repo a
 * member chose to show (member_projects.selected) that isn't already a project, with a
 * one-click "เพิ่ม" per repo + "เพิ่มทั้งหมด". Each becomes a full CMS projects row the
 * admin can enrich. (Ongoing auto-import on a new member selection = the cron leg,
 * pending the pipeline deploy.)
 */
export default async function ImportFromMembersPage() {
  const supabase = await createClient();
  const [repos, existing] = await Promise.all([
    supabase
      .from('member_projects')
      .select('id, name, url, year, members!inner(handle)')
      .eq('selected', true)
      .order('sort_order', { ascending: true }),
    supabase.from('projects').select('slug'),
  ]);
  const rows = (repos.data ?? []) as unknown as Row[];
  const taken = new Set(
    ((existing.data as { slug: string }[]) ?? []).map((p) => p.slug),
  );
  const available = rows.filter((r) => !taken.has(slugifyRepo(r.name)));

  return (
    <div className="admin-page">
      <div className="admin-page-head">
        <h1>นำเข้าจาก repo สมาชิก</h1>
        <Link href="/admin/projects" className="admin-edit">
          ← กลับ
        </Link>
      </div>
      <p className="t-meta">
        repo ที่สมาชิกติ๊กให้แสดง (บนโปรไฟล์ /team) ที่ยังไม่อยู่ในผลงานหลัก — กด “เพิ่ม”
        เพื่อสร้างเป็น project (แก้ไข/enrich ต่อใน CMS ได้)
      </p>

      {available.length === 0 ? (
        <p className="admin-empty">
          ไม่มี repo สมาชิกที่ยังไม่ได้เพิ่ม — เพิ่มครบแล้ว หรือยังไม่มีสมาชิกติ๊กเลือก
        </p>
      ) : (
        <>
          <form action={importAllMemberRepos} style={{ marginBottom: 16 }}>
            <button type="submit" className="btn">
              เพิ่มทั้งหมด ({available.length})
            </button>
          </form>
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>สมาชิก</th>
                  <th>Repo</th>
                  <th>ปี</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {available.map((r) => (
                  <tr key={r.id}>
                    <td>{handleOf(r)}</td>
                    <td>
                      <a href={r.url} target="_blank" rel="noopener noreferrer">
                        {r.name}
                      </a>
                    </td>
                    <td className="t-meta">{r.year ?? '—'}</td>
                    <td className="admin-row-actions">
                      <form action={importMemberRepo}>
                        <input type="hidden" name="id" value={r.id} />
                        <button type="submit" className="admin-edit">
                          + เพิ่ม
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
