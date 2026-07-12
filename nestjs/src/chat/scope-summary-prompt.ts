import type { ChatMessage } from '../llm/llm.service';
import type { HistoryMessage } from './build-messages';

const SYSTEM_PROMPT = `คุณเป็นระบบสกัดข้อมูลขอบเขตงานจากบทสนทนาระหว่างลูกค้ากับผู้ช่วย AI ของ T4 Labs
อ่านบทสนทนาด้านล่างแล้วตอบเป็น JSON เท่านั้น (ไม่มีข้อความอื่นนอก JSON) ตามโครงสร้าง:
{"hasEnoughInfo": boolean, "projectType": string|null, "budgetRange": string|null, "timeline": string|null, "notes": string|null}

- hasEnoughInfo: true ก็ต่อเมื่อบทสนทนาให้ข้อมูลเพียงพอต่อการสรุปประเภทงานอย่างน้อย 1 อย่าง
- projectType: ประเภทงานที่ลูกค้าต้องการ (เช่น "เว็บอสังหาริมทรัพย์") หรือ null ถ้ายังไม่ชัดเจน
- budgetRange: ช่วงงบประมาณโดยประมาณเป็นบาท หรือ null ถ้าไม่มีข้อมูล
- timeline: ระยะเวลาโดยประมาณ หรือ "ประเมินหลังสรุปขอบเขตงาน" ถ้ายังไม่ทราบ
- notes: requirement เด่นอื่น ๆ ที่จับใจความได้ หรือ null
- ห้ามสร้างข้อมูลที่ไม่มีอยู่ในบทสนทนา (ไม่สร้างข้อมูลเท็จ)`;

/** Assembles the extraction call's message list — pure, so it's independently testable. */
export function buildScopeSummaryMessages(
  history: HistoryMessage[],
): ChatMessage[] {
  return [{ role: 'system', content: SYSTEM_PROMPT }, ...history];
}
