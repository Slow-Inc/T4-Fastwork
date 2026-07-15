import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { SiteNav } from '@/components/site/site-nav';
import { SiteFooter } from '@/components/site/site-footer';
import {
  getCurrentMember,
  getCurrentMemberProjects,
  getCurrentMemberCertificates,
  getCurrentMemberPosts,
} from '@/lib/member-session';
import { MemberProfileForm } from './member-profile-form';
import { MemberProjectSelector } from './member-project-selector';
import { MemberCertificateManager } from './member-certificate-manager';
import { MemberBlogManager } from './member-blog-manager';

export const metadata: Metadata = {
  title: 'พื้นที่สมาชิก — T4 Labs',
  robots: { index: false, follow: false },
};

/**
 * Member area (Epic C / C2) — proves the auth round-trip. Not a member → login.
 * The edit UI (profile / skills / stack / project selection) lands with C3.
 */
export default async function MemberPage() {
  const member = await getCurrentMember();
  if (!member) redirect('/member/login');
  const projects = await getCurrentMemberProjects();
  const certificates = await getCurrentMemberCertificates();
  const posts = await getCurrentMemberPosts();

  return (
    <>
      <SiteNav />
      <div className="wrap">
        <section className="section">
          <div className="t-idx">พื้นที่สมาชิก</div>
          <h1>สวัสดี {member.handle}</h1>
          <p className="t-body">
            เข้าสู่ระบบในฐานะ <strong>{member.roleEn}</strong> — โปรไฟล์สาธารณะของคุณ:{' '}
            <a href={`/team/${member.slug}`}>/team/{member.slug}</a>
          </p>
          <div style={{ marginTop: 28, maxWidth: '52ch' }}>
            <div className="t-idx">แก้ไขโปรไฟล์</div>
            <MemberProfileForm
              initial={{
                skills: member.skills,
                stack: member.stack,
                readmeVisible: member.readmeVisible,
                readmeOverride: member.readmeOverride,
              }}
            />
          </div>
          {projects.length > 0 && (
            <div style={{ marginTop: 32, maxWidth: '52ch' }}>
              <div className="t-idx">เลือกผลงานที่จะแสดง</div>
              <p className="t-meta" style={{ marginBottom: 12 }}>
                ติ๊กผลงานที่ต้องการแสดงบนโปรไฟล์สาธารณะ — ที่ไม่ติ๊กจะถูกซ่อน
              </p>
              <MemberProjectSelector initial={projects} />
            </div>
          )}
          <div style={{ marginTop: 32, maxWidth: '52ch' }}>
            <div className="t-idx">ใบรับรองของฉัน</div>
            <p className="t-meta" style={{ marginBottom: 12 }}>
              เพิ่มใบรับรองของคุณ — จะแสดงบนโปรไฟล์หลังแอดมินอนุมัติ
            </p>
            <MemberCertificateManager memberId={member.id} initial={certificates} />
          </div>
          <div style={{ marginTop: 32, maxWidth: '52ch' }}>
            <div className="t-idx">บทความของฉัน</div>
            <p className="t-meta" style={{ marginBottom: 12 }}>
              เขียนบทความ — จะเผยแพร่บน /blog หลังแอดมินอนุมัติ
            </p>
            <MemberBlogManager
              memberId={member.id}
              authorName={member.handle}
              initial={posts}
            />
          </div>
        </section>
        <SiteFooter />
      </div>
    </>
  );
}
