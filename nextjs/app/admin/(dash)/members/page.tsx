import Link from 'next/link';
import { createClient } from '@/lib/server';

interface MemberRow {
  id: number;
  handle: string;
  slug: string;
  role_en: string;
  github_login: string | null;
  skills: string[] | null;
  stack: string[] | null;
}

/**
 * Admin Team/Members roster (flat authz). Every linked member is a full admin;
 * there is no member/admin split and no approval queue. Each member's profile
 * (skills/stack/README), project selection, and certificates are edited from that
 * member's edit page. Reads via the members SELECT policy (column-scoped).
 */
export default async function AdminMembersPage() {
  const supabase = await createClient();
  const { data } = await supabase
    .from('members')
    .select('id, handle, slug, role_en, github_login, skills, stack')
    .order('sort_order', { ascending: true });
  const members = (data ?? []) as MemberRow[];

  return (
    <div className="admin-page">
      <h1>ทีม / สมาชิก</h1>
      <p className="t-meta">
        ทุกคนเป็นแอดมิน — แก้ไขโปรไฟล์ ผลงาน และใบรับรองของสมาชิกได้จากปุ่ม “แก้ไข”
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
                    <Link className="admin-edit" href={`/admin/members/${m.id}/edit`}>
                      แก้ไข
                    </Link>
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
