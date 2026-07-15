import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { SiteNav } from '@/components/site/site-nav';
import { SiteFooter } from '@/components/site/site-footer';
import { getCurrentMember, hasSession } from '@/lib/member-session';
import { MemberLoginButton } from './login-button';

export const metadata: Metadata = {
  title: 'เข้าสู่ระบบสมาชิก — T4 Labs',
  robots: { index: false, follow: false },
};

/** Member sign-in (Epic C / C2). Already a member → straight to the member area. */
export default async function MemberLoginPage() {
  if (await getCurrentMember()) redirect('/member');
  // Signed in with GitHub but not a team member (link RPC found no row).
  const signedInNotMember = await hasSession();

  return (
    <>
      <SiteNav />
      <div className="wrap">
        <section className="section" style={{ maxWidth: '46ch' }}>
          <div className="t-idx">สมาชิกทีม</div>
          <h1>เข้าสู่ระบบ</h1>
          <p className="t-body">
            เข้าสู่ระบบด้วยบัญชี GitHub ของคุณเพื่อจัดการโปรไฟล์ของตัวเอง
          </p>
          {signedInNotMember && (
            <p className="field-err">
              บัญชี GitHub นี้ยังไม่ใช่สมาชิกทีม — ติดต่อผู้ดูแลหากคิดว่าผิดพลาด
            </p>
          )}
          <div style={{ marginTop: 18 }}>
            <MemberLoginButton />
          </div>
        </section>
        <SiteFooter />
      </div>
    </>
  );
}
