import Link from 'next/link';
import { createClient } from '@/lib/server';
import { importOrgRepo } from '../actions';
import { getTeamSnapshotPayload } from '@/lib/github';
import {
  availableOrgReposToImport,
  parseOrgReposFromTeamPayload,
  SLOW_INC_ORG,
  type ExistingProjectIdentity,
} from '@/lib/org-repo-import';

/**
 * Import Slow-Inc organization repos into the main showcase (/projects). Lists
 * repos from the durable `/github/team` org snapshot (never live GitHub) that
 * are not already represented, with a one-click import per row. Each becomes a
 * published team-owned CMS project the admin can enrich.
 */
export default async function ImportFromOrgPage() {
  const supabase = await createClient();
  const [teamPayload, existing] = await Promise.all([
    getTeamSnapshotPayload(),
    supabase.from('projects').select('slug, gh_owner, gh_repo'),
  ]);

  const catalogue = parseOrgReposFromTeamPayload(teamPayload, SLOW_INC_ORG);
  const identities: ExistingProjectIdentity[] = (
    (existing.data as
      | { slug: string; gh_owner: string | null; gh_repo: string | null }[]
      | null) ?? []
  ).map((p) => ({
    slug: p.slug,
    ghOwner: p.gh_owner,
    ghRepo: p.gh_repo,
  }));
  const available =
    catalogue === null ? [] : availableOrgReposToImport(catalogue, identities);

  return (
    <div className="admin-page">
      <div className="admin-page-head">
        <h1>นำเข้าจาก Slow-Inc</h1>
        <Link href="/admin/projects" className="admin-edit">
          ← กลับ
        </Link>
      </div>
      <p className="t-meta">
        repository ขององค์กร {SLOW_INC_ORG} จาก GitHub snapshot (ไม่เรียก GitHub
        สด) ที่ยังไม่อยู่ในผลงานหลัก — กด “เพิ่ม” เพื่อสร้างเป็น project ทีมที่เผยแพร่แล้ว
      </p>

      {catalogue === null ? (
        <p className="admin-empty">
          อ่าน snapshot ของ {SLOW_INC_ORG} ไม่ได้ — รอ refresh หรือลองใหม่ภายหลัง
          (ไม่สร้างรายการจากข้อมูลปลอม)
        </p>
      ) : available.length === 0 ? (
        <p className="admin-empty">
          ไม่มี repo ของ {SLOW_INC_ORG} ที่ยังไม่ได้เพิ่ม — เพิ่มครบแล้ว หรือ snapshot
          ว่าง
        </p>
      ) : (
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Repo</th>
                <th>คำอธิบาย</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {available.map((r) => (
                <tr key={`${SLOW_INC_ORG}/${r.name}`}>
                  <td>
                    <a href={r.htmlUrl} target="_blank" rel="noopener noreferrer">
                      {SLOW_INC_ORG}/{r.name}
                    </a>
                  </td>
                  <td className="t-meta">{r.description ?? '—'}</td>
                  <td className="admin-row-actions">
                    <form action={importOrgRepo}>
                      <input type="hidden" name="owner" value={SLOW_INC_ORG} />
                      <input type="hidden" name="repo" value={r.name} />
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
      )}
    </div>
  );
}
