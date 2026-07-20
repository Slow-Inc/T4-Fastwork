import type { Metadata } from 'next';
import { pageAlternates } from '@/lib/seo';
import { V3Shell } from '@/components/site/v3/v3-shell';
import { Breadcrumb } from '@/components/site/breadcrumb';

export const metadata: Metadata = {
  title: 'นโยบายความเป็นส่วนตัว — T4 Labs',
  description: 'นโยบายความเป็นส่วนตัวและการคุ้มครองข้อมูลส่วนบุคคล (PDPA) ของ T4 Labs',
  alternates: pageAlternates('/privacy'),
};

/**
 * Legal page — §14.5 blueprint **invisible**, §14.4 restraint: no reveal
 * animation, no robot in the reading path. The copy is deliberately NOT marked
 * `.rv`: legal text must never depend on an IntersectionObserver having run
 * (this page shipped invisible at `opacity: 0` for exactly that reason).
 */
export default function PrivacyPage() {
  return (
    <V3Shell blueprint="invisible">
      <main className="lab4-shell">
        <section className="v3-read">
          <Breadcrumb
            items={[{ label: 'หน้าแรก', href: '/' }, { label: 'นโยบายความเป็นส่วนตัว' }]}
          />
          <header className="v3-read-head">
            <span className="lab4-coord">LEGAL — PRIVACY</span>
            <h1>นโยบายความเป็นส่วนตัว</h1>
            <p className="v3-read-meta">ปรับปรุงล่าสุด 2026 · สอดคล้องกับ PDPA</p>
          </header>
          <div className="v3-read-body">
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
      </main>
    </V3Shell>
  );
}
