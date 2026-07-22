import Link from 'next/link';
import { notFound } from 'next/navigation';
import { createClient } from '@/lib/server';
import type {
  EditableProject,
  EditableCertificate,
} from '@/lib/member-session';
import { MemberProfileForm } from './profile-form';
import { MemberProjectSelector } from './project-selector';
import { MemberCertificateManager } from './certificate-manager';

interface MemberRow {
  id: number;
  handle: string;
  slug: string;
  role_en: string;
  skills: string[] | null;
  stack: string[] | null;
  readme_visible: boolean | null;
  readme_override: string | null;
}

/**
 * Admin edit of a single member (flat authz — every admin edits every member). Hosts the
 * former member self-service editors: profile (skills/stack/README), project selection, and
 * certificates. Reads all of the member's rows (admin RLS, 0024/0010 for-all/read-all
 * policies); the editors write cross-member via the same policies. There is no approval step.
 */
export default async function AdminMemberEditPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const memberId = Number(id);
  if (!Number.isInteger(memberId)) notFound();

  const supabase = await createClient();
  const { data: memberData } = await supabase
    .from('members')
    .select('id, handle, slug, role_en, skills, stack, readme_visible, readme_override')
    .eq('id', memberId)
    .maybeSingle();
  const member = memberData as MemberRow | null;
  if (!member) notFound();

  const { data: projectRows } = await supabase
    .from('member_projects')
    .select('id, name, url, tech, year, selected')
    .eq('member_id', memberId)
    .order('sort_order', { ascending: true });
  const { data: certRows } = await supabase
    .from('member_certificates')
    .select('id, issuer, title, asset_webp, asset_pdf, status')
    .eq('member_id', memberId)
    .order('sort_order', { ascending: true });

  const projects: EditableProject[] = (projectRows ?? []).map((r) => ({
    id: r.id as number,
    name: r.name as string,
    url: (r.url as string | null) ?? '',
    tech: (r.tech as string[] | null) ?? [],
    year: r.year as number,
    selected: (r.selected as boolean | null) ?? true,
  }));
  const certificates: EditableCertificate[] = (certRows ?? []).map((r) => ({
    id: r.id as number,
    issuer: r.issuer as string,
    title: r.title as string,
    assetWebp: (r.asset_webp as string | null) ?? null,
    assetPdf: (r.asset_pdf as string | null) ?? null,
    status: (r.status as string | null) ?? 'draft',
  }));

  return (
    <div className="admin-page">
      <div className="admin-page-head">
        <h1>แก้ไขสมาชิก — {member.handle}</h1>
        <Link href="/admin/members" className="admin-edit">
          ← กลับ
        </Link>
      </div>
      <p className="t-meta">
        โปรไฟล์สาธารณะ:{' '}
        <a href={`/team/${member.slug}`}>/team/{member.slug}</a> · บทบาท{' '}
        {member.role_en}
      </p>

      <section style={{ marginTop: 24, maxWidth: '60ch' }}>
        <h2 className="admin-subhead">โปรไฟล์ (Skills / Stack / README)</h2>
        <MemberProfileForm
          memberId={member.id}
          initial={{
            skills: member.skills ?? [],
            stack: member.stack ?? [],
            readmeVisible: member.readme_visible ?? false,
            readmeOverride: member.readme_override ?? '',
          }}
        />
      </section>

      <section style={{ marginTop: 32, maxWidth: '60ch' }}>
        <h2 className="admin-subhead">เลือกผลงานที่จะแสดง</h2>
        <p className="t-meta" style={{ marginBottom: 12 }}>
          ติ๊กผลงานที่จะแสดงบนโปรไฟล์สาธารณะของสมาชิก — ที่ไม่ติ๊กจะถูกซ่อน
        </p>
        <MemberProjectSelector initial={projects} />
      </section>

      <section style={{ marginTop: 32, maxWidth: '60ch' }}>
        <h2 className="admin-subhead">ใบรับรอง</h2>
        <p className="t-meta" style={{ marginBottom: 12 }}>
          เพิ่ม/ลบใบรับรองของสมาชิก — เผยแพร่ทันที ไม่ต้องรออนุมัติ
        </p>
        <MemberCertificateManager memberId={member.id} initial={certificates} />
      </section>
    </div>
  );
}
