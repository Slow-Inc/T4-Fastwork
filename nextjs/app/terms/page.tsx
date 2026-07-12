import type { Metadata } from 'next';
import { SiteNav } from '@/components/site/site-nav';
import { SiteFooter } from '@/components/site/site-footer';
import { Breadcrumb } from '@/components/site/breadcrumb';

export const metadata: Metadata = {
  title: 'ข้อกำหนดการใช้งาน — T4 Labs',
  description: 'ข้อกำหนดและเงื่อนไขการใช้งานเว็บไซต์และบริการของ T4 Labs',
};

export default function TermsPage() {
  return (
    <>
      <SiteNav />
      <div className="wrap">
        <section className="section section-page blog-article">
          <Breadcrumb items={[{ label: 'หน้าแรก', href: '/' }, { label: 'ข้อกำหนดการใช้งาน' }]} />
          <div className="page-head rv">
            <div className="t-idx">Terms</div>
            <h1>ข้อกำหนดการใช้งาน</h1>
          </div>
          <div className="blog-body rv">
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
        <SiteFooter />
      </div>
    </>
  );
}
