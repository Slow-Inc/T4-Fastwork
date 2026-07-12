import type { Metadata } from 'next';
import { SiteNav } from '@/components/site/site-nav';
import { SiteFooter } from '@/components/site/site-footer';
import { Breadcrumb } from '@/components/site/breadcrumb';

export const metadata: Metadata = {
  title: 'นโยบายความเป็นส่วนตัว — T4 Labs',
  description: 'นโยบายความเป็นส่วนตัวและการคุ้มครองข้อมูลส่วนบุคคล (PDPA) ของ T4 Labs',
};

export default function PrivacyPage() {
  return (
    <>
      <SiteNav />
      <div className="wrap">
        <section className="section section-page blog-article">
          <Breadcrumb items={[{ label: 'หน้าแรก', href: '/' }, { label: 'นโยบายความเป็นส่วนตัว' }]} />
          <div className="page-head rv">
            <div className="t-idx">Privacy</div>
            <h1>นโยบายความเป็นส่วนตัว</h1>
          </div>
          <div className="blog-body rv">
            <p>
              T4 Labs เก็บข้อมูลเท่าที่จำเป็นต่อการติดต่อและให้บริการเท่านั้น
              (เช่น ชื่อ อีเมล และรายละเอียดโจทย์ที่คุณส่งผ่านฟอร์มติดต่อหรือผู้ช่วย AI)
            </p>
            <p>
              เราใช้ข้อมูลเพื่อตอบกลับ ประเมินงาน และปรับปรุงบริการ ไม่ขายหรือส่งต่อข้อมูล
              ให้บุคคลที่สามเพื่อการตลาด และเก็บ log บทสนทนา AI แบบไม่ผูกกับตัวตน
              (hash IP) เพื่อวิเคราะห์คุณภาพบริการ
            </p>
            <p>
              คุณมีสิทธิ์ขอเข้าถึง แก้ไข หรือลบข้อมูลของคุณได้ตาม พ.ร.บ. คุ้มครองข้อมูล
              ส่วนบุคคล (PDPA) โดยติดต่อผ่านหน้า “ติดต่อเรา”
            </p>
          </div>
        </section>
        <SiteFooter />
      </div>
    </>
  );
}
