/**
 * Blog content (Requirement §4.6 / §6.4), bilingual (§7.1). Static layer;
 * swappable for a CMS/DB source later.
 */
export interface BlogPost {
  slug: string;
  title: string;
  excerpt: string;
  content: string[];
  titleEn?: string;
  excerptEn?: string;
  contentEn?: string[];
  author: string;
  tags: string[];
  publishedAt: string;
  readTimeMin: number;
  views: number;
}

export const blogPosts: BlogPost[] = [
  {
    slug: 'rag-chatbot-for-business',
    title: 'ทำ AI Chatbot แบบ RAG ให้ธุรกิจ — เริ่มยังไงให้ตอบแม่น',
    excerpt:
      'RAG (Retrieval-Augmented Generation) ทำให้แชทบอทตอบอ้างอิงข้อมูลจริงของธุรกิจได้ บทความนี้อธิบายหลักการและขั้นตอนวางระบบ',
    content: [
      'RAG คือการให้ LLM ค้นข้อมูลจากคลังความรู้ของเราก่อนตอบ ทำให้คำตอบอ้างอิงข้อมูลจริงและลดการมั่ว (hallucination)',
      'องค์ประกอบหลักคือ การทำ embedding เนื้อหา, เก็บใน vector store เช่น pgvector, และดึงชิ้นที่เกี่ยวข้องมาประกอบ prompt',
      'สำหรับธุรกิจไทย การเลือก embedding model ที่รองรับภาษาไทยดีและการ chunk เนื้อหาให้เหมาะสมคือกุญแจสำคัญของความแม่นยำ',
    ],
    titleEn: 'Building a RAG chatbot for business — how to make it accurate',
    excerptEn:
      'RAG lets a chatbot answer from your real business data. This post covers the principles and how to set it up.',
    contentEn: [
      'RAG has the LLM retrieve from your knowledge base before answering, so responses are grounded in real data and hallucinate less.',
      'The core parts are embedding your content, storing it in a vector store like pgvector, and pulling relevant chunks into the prompt.',
      'For Thai businesses, choosing an embedding model with strong Thai support and chunking content well are the keys to accuracy.',
    ],
    author: 'T4 Labs',
    tags: ['AI', 'RAG', 'Chatbot'],
    publishedAt: '2026-06-01',
    readTimeMin: 6,
    views: 1240,
  },
  {
    slug: 'nextjs-vs-traditional-web',
    title: 'ทำไมเว็บสมัยใหม่ถึงเลือก Next.js — เร็ว SEO ดี และสเกลได้',
    excerpt:
      'Next.js App Router รวมข้อดีของ static, server-render และ client interactivity ไว้ในเฟรมเวิร์กเดียว เหมาะกับเว็บที่ต้องการทั้งความเร็วและ SEO',
    content: [
      'Next.js ให้เลือก rendering ได้ตามหน้า — static สำหรับหน้าเนื้อหา, server สำหรับข้อมูลสด, และ client สำหรับส่วน interactive',
      'ผลลัพธ์คือเว็บที่โหลดไว ติด SEO ง่าย และยังทำ feature ซับซ้อนอย่างแชทเรียลไทม์ได้ในโปรเจกต์เดียว',
      'สำหรับธุรกิจที่อยากเริ่มเล็กแล้วสเกลต่อ นี่คือรากฐานที่ไม่ต้องรื้อทีหลัง',
    ],
    titleEn: 'Why modern sites pick Next.js — fast, SEO-friendly and scalable',
    excerptEn:
      'Next.js App Router combines static, server-render and client interactivity in one framework — ideal when you need both speed and SEO.',
    contentEn: [
      'Next.js lets you pick rendering per page — static for content, server for live data, and client for interactive parts.',
      'The result is a fast, easily-indexed site that can still ship complex features like realtime chat in one project.',
      'For businesses that want to start small and scale, it’s a foundation you won’t have to tear out later.',
    ],
    author: 'T4 Labs',
    tags: ['Next.js', 'Performance', 'SEO'],
    publishedAt: '2026-05-15',
    readTimeMin: 5,
    views: 980,
  },
  {
    slug: 'saas-mvp-in-8-weeks',
    title: 'สร้าง SaaS MVP ใน 8 สัปดาห์ — โฟกัสอะไรก่อน',
    excerpt:
      'การทำ MVP ที่ดีไม่ใช่การทำให้ครบทุกฟีเจอร์ แต่คือการเลือกสิ่งที่พิสูจน์คุณค่าหลักได้เร็วที่สุด',
    content: [
      'เริ่มจากนิยาม core value ให้ชัด แล้วตัดทุกอย่างที่ไม่จำเป็นต่อการพิสูจน์มันออกไปก่อน',
      'วางสถาปัตยกรรมที่สเกลได้ตั้งแต่ต้น (auth, multi-tenant, billing) แม้จะยังทำไม่ครบ เพื่อไม่ต้องรื้อภายหลัง',
      'ปล่อยเร็ว วัดผลจริงกับผู้ใช้ แล้วค่อย ๆ เพิ่มฟีเจอร์ตาม feedback',
    ],
    titleEn: 'Ship a SaaS MVP in 8 weeks — what to focus on first',
    excerptEn:
      'A good MVP isn’t every feature — it’s choosing what proves the core value fastest.',
    contentEn: [
      'Start by defining the core value clearly, then cut everything not needed to prove it.',
      'Lay down a scalable architecture early (auth, multi-tenant, billing) even if unfinished, so you don’t rebuild later.',
      'Ship fast, measure with real users, and add features based on feedback.',
    ],
    author: 'T4 Labs',
    tags: ['SaaS', 'MVP', 'Startup'],
    publishedAt: '2026-04-20',
    readTimeMin: 7,
    views: 1530,
  },
  {
    slug: 'ocr-document-ai-thai',
    title: 'OCR และ Document AI ภาษาไทย — ดึงข้อมูลจากเอกสารอัตโนมัติ',
    excerpt:
      'ระบบ OCR + LLM ช่วยดึงข้อมูลจากใบเสร็จ สัญญา และแบบฟอร์มภาษาไทยได้แม่นขึ้นมาก บทความนี้เล่าแนวทางที่ใช้จริง',
    content: [
      'OCR ภาษาไทยมีความท้าทายเรื่องวรรณยุกต์และการเว้นวรรค การรวม OCR กับ LLM ช่วยตรวจแก้และจัดโครงสร้างข้อมูลได้ดีขึ้น',
      'workflow ที่ใช้จริงคือ สแกน → OCR → LLM ตรวจ/จัดรูปแบบ → ส่งออกเป็น JSON ที่มีโครงสร้าง พร้อม webhook กลับระบบลูกค้า',
      'เราต่อยอดจากประสบการณ์งานอย่าง MangaDock ที่รวม OCR และ LLM ไว้ใน pipeline เดียว',
    ],
    titleEn: 'Thai OCR and Document AI — extracting data automatically',
    excerptEn:
      'OCR + LLM extracts data from Thai receipts, contracts and forms far more accurately. Here’s the approach we use.',
    contentEn: [
      'Thai OCR is tricky with tone marks and spacing; pairing OCR with an LLM improves correction and structuring.',
      'The real workflow is scan → OCR → LLM verify/format → export structured JSON, with a webhook back to the client system.',
      'We build on experience from projects like MangaDock, which unites OCR and LLM in a single pipeline.',
    ],
    author: 'T4 Labs',
    tags: ['AI', 'OCR', 'Document AI'],
    publishedAt: '2026-03-10',
    readTimeMin: 6,
    views: 870,
  },
];

export function getPost(slug: string): BlogPost | undefined {
  return blogPosts.find((p) => p.slug === slug);
}

export function searchPosts(q?: string): BlogPost[] {
  const query = q?.trim().toLowerCase();
  const sorted = [...blogPosts].sort((a, b) =>
    b.publishedAt.localeCompare(a.publishedAt),
  );
  if (!query) return sorted;
  return sorted.filter((p) =>
    `${p.title} ${p.excerpt} ${p.tags.join(' ')}`.toLowerCase().includes(query),
  );
}
