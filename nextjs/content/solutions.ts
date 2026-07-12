/**
 * The six solution types shown in the homepage Solution Selector
 * (Requirement §4.1.3). Each links to /recommend/[type].
 */
export interface Solution {
  code: string;
  slug: string;
  title: string;
  description: string;
}

export const solutions: Solution[] = [
  {
    code: 'S/01',
    slug: 'saas',
    title: 'SaaS Platform',
    description: 'Multi-tenant · subscription · dashboard',
  },
  {
    code: 'S/02',
    slug: 'webapp',
    title: 'Web Application',
    description: 'Marketplace · booking · internal tools',
  },
  {
    code: 'S/03',
    slug: 'ai-product',
    title: 'AI Product',
    description: 'Chatbot · RAG · OCR · automation',
  },
  {
    code: 'S/04',
    slug: 'mvp',
    title: 'MVP for Startup',
    description: 'สร้างเร็ว เพื่อ launch / ระดมทุน',
  },
  {
    code: 'S/05',
    slug: 'internal-system',
    title: 'Internal System',
    description: 'ระบบหลังบ้าน · integration · API',
  },
  {
    code: 'S/06',
    slug: 'other',
    title: 'อื่นๆ / ปรึกษาโจทย์',
    description: 'ไม่แน่ใจโจทย์ — คุยกับเราหรือถาม AI',
  },
];
