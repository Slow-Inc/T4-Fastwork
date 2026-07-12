/**
 * Deterministic single-project grounding (Requirement §5.4): when a visitor
 * asks the AI about a project they're currently viewing, this formats its
 * full record for the system prompt so the answer doesn't depend on
 * semantic/embedding retrieval surfacing that exact project.
 */
export interface ProjectContextRecord {
  slug: string;
  title: string;
  titleEn: string | null;
  description: string | null;
  content: string | null;
  category: string | null;
  technologies: string[];
  tags: string[];
  liveUrl: string | null;
}

export function formatProjectContext(
  p: ProjectContextRecord,
  language: 'th' | 'en',
): string {
  const title = language === 'en' && p.titleEn ? p.titleEn : p.title;
  const en = language === 'en';

  const lines: string[] = [en ? `Project: ${title}` : `ผลงาน: ${title}`];
  if (p.category) {
    lines.push(en ? `Category: ${p.category}` : `หมวดหมู่: ${p.category}`);
  }
  if (p.technologies.length > 0) {
    lines.push(
      en
        ? `Technologies: ${p.technologies.join(', ')}`
        : `เทคโนโลยี: ${p.technologies.join(', ')}`,
    );
  }
  if (p.tags.length > 0) {
    lines.push(en ? `Tags: ${p.tags.join(', ')}` : `แท็ก: ${p.tags.join(', ')}`);
  }
  if (p.description) {
    lines.push(en ? `Summary: ${p.description}` : `คำอธิบาย: ${p.description}`);
  }
  if (p.content) {
    lines.push(en ? `Details: ${p.content}` : `รายละเอียด: ${p.content}`);
  }
  if (p.liveUrl) {
    lines.push(en ? `Live URL: ${p.liveUrl}` : `ลิงก์เว็บจริง: ${p.liveUrl}`);
  }

  return lines.join('\n');
}
