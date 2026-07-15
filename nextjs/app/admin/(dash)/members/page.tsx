import Link from 'next/link';
import { createClient } from '@/lib/server';

interface MemberRow {
  handle: string;
  slug: string;
  role_en: string;
  github_login: string | null;
  skills: string[] | null;
  stack: string[] | null;
}

/**
 * Admin Team/Members overview (Epic C / C6). A read-only roster of the members table
 * — the actionable member-content review lives in /admin/approvals (the D4 queue).
 * Reads via the public members SELECT policy (column-scoped); member self-service edits
 * (skills/stack/README/project-selection) happen in the member area, admins oversee.
 */
export default async function AdminMembersPage() {
  const supabase = await createClient();
  const { data } = await supabase
    .from('members')
    .select('handle, slug, role_en, github_login, skills, stack')
    .order('sort_order', { ascending: true });
  const members = (data ?? []) as MemberRow[];

  return (
    <div className="admin-page">
      <h1>ทีม / สมาชิก</h1>
      <p className="t-meta">
        รายชื่อสมาชิก — แก้ไขโปรไฟล์เป็นการจัดการตนเองของสมาชิก · อนุมัติเนื้อหาที่{' '}
        <Link href="/admin/approvals">อนุมัติเนื้อหาสมาชิก</Link>
      </p>

      {members.length === 0 ? (
        <p className="admin-empty">ยังไม่มีสมาชิก</p>
      ) : (
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Handle</th>
                <th>บทบาท</th>
                <th>GitHub</th>
                <th>Skills</th>
                <th>Stack</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {members.map((m) => (
                <tr key={m.handle}>
                  <td>{m.handle}</td>
                  <td>{m.role_en}</td>
                  <td className="t-meta">{m.github_login ?? '—'}</td>
                  <td className="t-meta">{m.skills?.length ?? 0}</td>
                  <td className="t-meta">{m.stack?.length ?? 0}</td>
                  <td className="admin-row-actions">
                    <Link className="admin-edit" href={`/team/${m.slug}`}>
                      โปรไฟล์ ↗
                    </Link>
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
