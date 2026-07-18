'use client';

import { useT } from '@/i18n/locale-context';
import { FaqAccordion } from '../faq-accordion';
import { LabSectionHeader } from './lab-section';

/** FAQ section — reuses the shipped, accessible FaqAccordion (native disclosure),
 *  wrapped in the /lab section rhythm. */
export function LabFaqSection() {
  const items = [
    {
      question: useT('ใช้เวลานานแค่ไหน?', 'How long does it take?'),
      answer: useT(
        'ตั้งแต่ไม่กี่สัปดาห์สำหรับ MVP ไปจนถึงหลายเดือนสำหรับแพลตฟอร์มใหญ่ — เราส่งเป็นชิ้นเล็กให้เห็นของเร็ว',
        'A few weeks for an MVP up to several months for a large platform — we ship in small increments so you see progress fast.',
      ),
    },
    {
      question: useT('ราคาเป็นยังไง?', 'How does pricing work?'),
      answer: useT(
        'ขึ้นกับขอบเขตงาน เราคุยเป้าหมายก่อนแล้วเสนอทางที่คุ้มที่สุด',
        'It depends on scope — we align on goals first, then propose the soundest option.',
      ),
    },
    {
      question: useT('เริ่มเล็กแล้วสเกลต่อได้ไหม?', 'Can we start small and scale later?'),
      answer: useT(
        'ได้ — เราออกแบบสถาปัตยกรรมให้ต่อยอดได้โดยไม่ต้องเปลี่ยนทีม',
        'Yes — we architect for growth so you scale without switching teams.',
      ),
    },
    {
      question: useT('ทำ AI / RAG ด้วยไหม?', 'Do you build AI / RAG?'),
      answer: useT(
        'ทำ — ผู้ช่วย AI, ค้นหาเชิงความหมาย และ RAG บนข้อมูลของคุณเอง',
        'We do — AI assistants, semantic search, and RAG grounded in your own data.',
      ),
    },
  ];
  return (
    <section className="lab-section">
      <LabSectionHeader
        kicker={useT('คำถามที่พบบ่อย', 'Common questions')}
        title={useT(<>คำถามที่พบบ่อย</>, <>FAQ</>)}
      />
      <FaqAccordion items={items} />
    </section>
  );
}
