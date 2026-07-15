import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { SiteNav } from '@/components/site/site-nav';
import { SiteFooter } from '@/components/site/site-footer';
import { getCurrentMember } from '@/lib/member-session';
import { MemberProfileForm } from './member-profile-form';

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
              }}
            />
            <p className="t-meta" style={{ marginTop: 12 }}>
              เร็ว ๆ นี้: เลือกผลงานจาก GitHub · README override (C3 ต่อ)
            </p>
          </div>
        </section>
        <SiteFooter />
      </div>
    </>
  );
}
