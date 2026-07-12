/**
 * The six solution types shown in the homepage Solution Selector
 * (Requirement §4.1.3). Each links to /recommend/[type].
 */
export interface Solution {
  code: string;
  slug: string;
  title: string;
  titleEn: string;
  description: string;
  descriptionEn: string;
}

export const solutions: Solution[] = [
  {
    code: 'S/01',
    slug: 'saas',
    title: 'SaaS Platform',
    titleEn: 'SaaS Platform',
    description: 'Multi-tenant · subscription · dashboard',
    descriptionEn: 'Multi-tenant · subscription · dashboard',
  },
  {
    code: 'S/02',
    slug: 'webapp',
    title: 'Web Application',
    titleEn: 'Web Application',
    description: 'Marketplace · booking · internal tools',
    descriptionEn: 'Marketplace · booking · internal tools',
  },
  {
    code: 'S/03',
    slug: 'ai-product',
    title: 'AI Product',
    titleEn: 'AI Product',
    description: 'Chatbot · RAG · OCR · automation',
    descriptionEn: 'Chatbot · RAG · OCR · automation',
  },
  {
    code: 'S/04',
    slug: 'mvp',
    title: 'MVP for Startup',
    titleEn: 'MVP for Startup',
    description: 'สร้างเร็ว เพื่อ launch / ระดมทุน',
    descriptionEn: 'Ship fast to launch / raise funding',
  },
  {
    code: 'S/05',
    slug: 'internal-system',
    title: 'Internal System',
    titleEn: 'Internal System',
    description: 'ระบบหลังบ้าน · integration · API',
    descriptionEn: 'Back-office · integration · API',
  },
  {
    code: 'S/06',
    slug: 'other',
    title: 'อื่นๆ / ปรึกษาโจทย์',
    titleEn: 'Something else',
    description: 'ไม่แน่ใจโจทย์ — คุยกับเราหรือถาม AI',
    descriptionEn: 'Not sure yet — talk to us or ask the AI',
  },
];
