/**
 * Builds the chat system prompt (Requirement.MD §5). Defines the assistant's
 * role (recommend T4 Labs' real work, stay in scope, end with a call-to-contact),
 * instructs the inline card markers the StreamMarkerParser extracts, and injects
 * the RAG-retrieved context. Pure function — framework-agnostic.
 */
import {
  formatProjectContext,
  type ProjectContextRecord,
} from './project-context';

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
  /** Set when the visitor arrived from a project's detail page (§5.4) — deterministic
   * ground truth for that exact project, independent of semantic retrieval. */
  activeProject?: ProjectContextRecord;
}

/**
 * Ground-truth team facts (Requirement.MD §4.1). Pinned into the prompt so the
 * model states the real scale and never inflates it (#30). Single source of
 * truth — update here if the real numbers change.
 */
export const TEAM_FACTS = {
  yearsExperience: 5,
  projectsBuilt: '21+',
} as const;

function teamFactsBlock(language: 'th' | 'en'): string {
  return language === 'en'
    ? `Team facts (ground truth — state these exactly, do not invent or inflate): ${TEAM_FACTS.yearsExperience} years of experience, ${TEAM_FACTS.projectsBuilt} projects built (team + personal). Do not invent statistics, client names, or numbers not given here or in the context.`
    : `ข้อมูลจริงของทีม (ความจริง — ระบุตามนี้เป๊ะ ห้ามแต่งหรือทำให้เกินจริง): ประสบการณ์ ${TEAM_FACTS.yearsExperience} ปี ทำมาแล้ว ${TEAM_FACTS.projectsBuilt} โปรเจกต์ (ทีม + ส่วนตัว) ห้ามแต่งตัวเลข ชื่อลูกค้า หรือสถิติที่ไม่ได้ให้ไว้ตรงนี้หรือใน context`;
}

function markerFor(item: RetrievedItem): string {
  return item.kind === 'project'
    ? `[PROJECT:${item.ref}]`
    : item.kind === 'service'
      ? `[SERVICE:${item.ref}]`
      : `[FAQ:${item.ref}]`;
}

function contextBlock(
  retrieved: RetrievedItem[],
  language: 'th' | 'en',
): string {
  if (retrieved.length === 0) {
    return language === 'th'
      ? 'ไม่พบผลงาน/บริการที่ตรงกับคำถามนี้โดยตรง — แนะนำอย่างกว้างและชวนให้เล่าโจทย์เพิ่ม'
      : 'No directly matching work/service was found — advise broadly and invite more detail.';
  }
  return retrieved
    .map((i) => `- ${markerFor(i)} ${i.title} — ${i.summary}`)
    .join('\n');
}

function activeProjectBlock(
  project: ProjectContextRecord,
  language: 'th' | 'en',
): string {
  const formatted = formatProjectContext(project, language);
  return language === 'en'
    ? [
        "The visitor is currently viewing this exact project's detail page. Treat the record " +
          'below as ground truth for detailed questions about it — you do not need retrieved ' +
          'context to answer these, and must not contradict it:',
        formatted,
      ].join('\n')
    : [
        'ผู้เข้าชมกำลังดูหน้ารายละเอียดผลงานนี้อยู่ ให้ถือว่าข้อมูลด้านล่างเป็นความจริงสำหรับคำถามเชิงลึก ' +
          'เกี่ยวกับผลงานนี้โดยตรง — ไม่ต้องรอ context ที่ค้นมา และห้ามขัดแย้งกับข้อมูลนี้:',
        formatted,
      ].join('\n');
}

export function buildSystemPrompt(opts: SystemPromptOptions): string {
  const { language, retrieved, activeProject } = opts;
  const context = contextBlock(retrieved, language);
  const projectBlock = activeProject
    ? [activeProjectBlock(activeProject, language)]
    : [];

  if (language === 'en') {
    return [
      "You are T4 Labs' assistant. T4 Labs is a software team building SaaS, web apps, and AI products.",
      "Recommend the team's real work that fits the visitor's problem. Stay strictly within T4 Labs' services — do not answer off-topic questions. Reply in English. Keep answers short and concrete. End every reply with a call-to-contact.",
      'When you recommend a project, cite it inline as [PROJECT:<slug>]. When you recommend a service, cite it as [SERVICE:<id>]. Use ONLY the refs from the context below — never invent one. Do not include raw URLs.',
      teamFactsBlock('en'),
      ...projectBlock,
      'Context (retrieved for this question):',
      context,
    ].join('\n\n');
  }

  return [
    'คุณคือผู้ช่วยของ T4 Labs — ทีมพัฒนาซอฟต์แวร์ที่สร้าง SaaS, Web Application และ AI Product',
    'หน้าที่: แนะนำผลงาน/บริการจริงของทีมที่ตรงกับโจทย์ของผู้เข้าชม ตอบเฉพาะขอบเขตบริการของ T4 Labs เท่านั้น (อย่าตอบนอกเรื่อง) ตอบเป็นภาษาไทย สั้น กระชับ เป็นรูปธรรม และปิดท้ายทุกครั้งด้วยการชวนติดต่อ/จ้างงาน',
    'เมื่อแนะนำผลงาน ให้อ้างอิงแบบ inline ด้วย [PROJECT:<slug>] และเมื่อแนะนำบริการ ให้ใช้ [SERVICE:<id>] โดยใช้เฉพาะ ref จาก context ด้านล่างเท่านั้น ห้ามแต่งขึ้นเอง และห้ามใส่ URL ดิบ',
    teamFactsBlock('th'),
    ...projectBlock,
    'ข้อมูลที่ค้นมาสำหรับคำถามนี้ (context):',
    context,
  ].join('\n\n');
}
