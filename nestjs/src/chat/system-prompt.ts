/**
 * Builds the chat system prompt (Requirement.MD §5). Defines the assistant's
 * role (recommend T4 Labs' real work, stay in scope, end with a call-to-contact),
 * instructs the inline card markers the StreamMarkerParser extracts, and injects
 * the RAG-retrieved context. Pure function — framework-agnostic.
 */

export interface RetrievedItem {
  kind: 'project' | 'service' | 'faq';
  /** slug for a project, numeric id for a service/faq — the marker payload. */
  ref: string;
  title: string;
  summary: string;
}

export interface SystemPromptOptions {
  language: 'th' | 'en';
  retrieved: RetrievedItem[];
}

function markerFor(item: RetrievedItem): string {
  return item.kind === 'project'
    ? `[PROJECT:${item.ref}]`
    : item.kind === 'service'
      ? `[SERVICE:${item.ref}]`
      : `[FAQ:${item.ref}]`;
}

function contextBlock(retrieved: RetrievedItem[], language: 'th' | 'en'): string {
  if (retrieved.length === 0) {
    return language === 'th'
      ? 'ไม่พบผลงาน/บริการที่ตรงกับคำถามนี้โดยตรง — แนะนำอย่างกว้างและชวนให้เล่าโจทย์เพิ่ม'
      : 'No directly matching work/service was found — advise broadly and invite more detail.';
  }
  return retrieved
    .map((i) => `- ${markerFor(i)} ${i.title} — ${i.summary}`)
    .join('\n');
}

export function buildSystemPrompt(opts: SystemPromptOptions): string {
  const { language, retrieved } = opts;
  const context = contextBlock(retrieved, language);

  if (language === 'en') {
    return [
      "You are T4 Labs' assistant. T4 Labs is a software team building SaaS, web apps, and AI products.",
      'Recommend the team\'s real work that fits the visitor\'s problem. Stay strictly within T4 Labs\' services — do not answer off-topic questions. Reply in English. Keep answers short and concrete. End every reply with a call-to-contact.',
      'When you recommend a project, cite it inline as [PROJECT:<slug>]. When you recommend a service, cite it as [SERVICE:<id>]. Use ONLY the refs from the context below — never invent one. Do not include raw URLs.',
      'Context (retrieved for this question):',
      context,
    ].join('\n\n');
  }

  return [
    'คุณคือผู้ช่วยของ T4 Labs — ทีมพัฒนาซอฟต์แวร์ที่สร้าง SaaS, Web Application และ AI Product',
    'หน้าที่: แนะนำผลงาน/บริการจริงของทีมที่ตรงกับโจทย์ของผู้เข้าชม ตอบเฉพาะขอบเขตบริการของ T4 Labs เท่านั้น (อย่าตอบนอกเรื่อง) ตอบเป็นภาษาไทย สั้น กระชับ เป็นรูปธรรม และปิดท้ายทุกครั้งด้วยการชวนติดต่อ/จ้างงาน',
    'เมื่อแนะนำผลงาน ให้อ้างอิงแบบ inline ด้วย [PROJECT:<slug>] และเมื่อแนะนำบริการ ให้ใช้ [SERVICE:<id>] โดยใช้เฉพาะ ref จาก context ด้านล่างเท่านั้น ห้ามแต่งขึ้นเอง และห้ามใส่ URL ดิบ',
    'ข้อมูลที่ค้นมาสำหรับคำถามนี้ (context):',
    context,
  ].join('\n\n');
}
