import type { Metadata } from 'next';
import { pageAlternates } from '@/lib/seo';
import { V3Shell } from '@/components/site/v3/v3-shell';
import { Breadcrumb } from '@/components/site/breadcrumb';

export const metadata: Metadata = {
  title: 'ข้อกำหนดการใช้งาน — T4 Labs',
  description: 'ข้อกำหนดและเงื่อนไขการใช้งานเว็บไซต์และบริการของ T4 Labs',
  alternates: pageAlternates('/terms'),
};

/** Legal page — see the note in `app/privacy/page.tsx` (same treatment). */
export default function TermsPage() {
  return (
    <V3Shell blueprint="invisible">
      <main className="lab4-shell">
        <section className="v3-read">
          <Breadcrumb
            items={[{ label: 'หน้าแรก', href: '/' }, { label: 'ข้อกำหนดการใช้งาน' }]}
          />
          <header className="v3-read-head">
            <span className="lab4-coord">LEGAL — TERMS</span>
            <h1>ข้อกำหนดการใช้งาน</h1>
            <p className="v3-read-meta">ปรับปรุงล่าสุด 2026</p>
          </header>
          <div className="v3-read-body">
            <p>
              เนื้อหา ผลงาน และการประเมินบนเว็บไซต์นี้ใช้เพื่อการนำเสนอบริการ
              การจ้างงานจริงและการชำระเงินดำเนินการผ่าน Fastwork ซึ่งมีระบบคุ้มครอง
              ทั้งผู้ว่าจ้างและผู้รับงาน
            </p>
            <p>
              ผู้ช่วย AI ให้ข้อมูลเบื้องต้นเพื่อประกอบการตัดสินใจ อาจมีข้อผิดพลาด
              โปรดตรวจสอบก่อนตัดสินใจ ขอบเขตงาน ราคา และเงื่อนไขที่มีผลผูกพัน
              จะระบุในข้อเสนอที่ตกลงร่วมกันเท่านั้น
            </p>
            <p>
              เมื่อส่งมอบงานและชำระเงินครบถ้วน กรรมสิทธิ์ในเว็บไซต์และซอร์สโค้ด
              เป็นของลูกค้าตามที่ระบุในข้อเสนอ
            </p>
          </div>
        </section>
      </main>
    </V3Shell>
  );
}
