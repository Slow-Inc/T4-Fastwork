/**
 * Real seed content for T4 Labs (#6). Relations are expressed by slug and
 * resolved to ids in seed.ts. FAQs are adapted from the Bigzweb-style reference
 * the user provided, re-pointed to T4 Labs' positioning and stack (§1, §7).
 */

export const categories = [
  { name: 'AI Product', nameEn: 'AI Product', slug: 'ai-product', sortOrder: 1 },
  { name: 'เว็บแอปพลิเคชัน', nameEn: 'Web Application', slug: 'web-app', sortOrder: 2 },
  { name: 'SaaS Platform', nameEn: 'SaaS Platform', slug: 'saas', sortOrder: 3 },
  { name: 'ระบบภายใน / Automation', nameEn: 'Internal System', slug: 'internal-system', sortOrder: 4 },
] as const;

export const technologies = [
  { name: 'Next.js', slug: 'nextjs' },
  { name: 'Nest.js', slug: 'nestjs' },
  { name: 'Bun', slug: 'bun' },
  { name: 'TypeScript', slug: 'typescript' },
  { name: 'Python', slug: 'python' },
  { name: 'Supabase', slug: 'supabase' },
  { name: 'PostgreSQL', slug: 'postgresql' },
  { name: 'Redis', slug: 'redis' },
  { name: 'Docker', slug: 'docker' },
  { name: 'Tailwind CSS', slug: 'tailwind' },
] as const;

export const tags = [
  { name: 'AI', slug: 'ai' },
  { name: 'OCR', slug: 'ocr' },
  { name: 'LLM', slug: 'llm' },
  { name: 'RAG', slug: 'rag' },
  { name: 'Translation', slug: 'translation' },
  { name: 'Realtime', slug: 'realtime' },
  { name: 'Microservices', slug: 'microservices' },
  { name: 'Dashboard', slug: 'dashboard' },
] as const;

export const projects = [
  {
    slug: 'mangadock',
    title: 'MangaDock',
    titleEn: 'MangaDock',
    description:
      'แพลตฟอร์มอ่านและแปลมังงะด้วย AI — รวม OCR ตรวจจับข้อความในภาพ + LLM แปลอัตโนมัติ แบบครบวงจร',
    content:
      'MangaDock เป็นแพลตฟอร์มอ่านมังงะพร้อมระบบแปลภาพด้วย Machine Learning ประกอบด้วย 3 services: ' +
      'Frontend (Next.js), Backend (Nest.js/Bun orchestration + Supabase), และ MIT — Manga Image Translator ' +
      'ไมโครเซอร์วิส Python สำหรับ GPU inference (ตรวจจับกล่องข้อความ OCR แล้วแปลด้วย LLM ผ่าน OpenAI-compatible gateway). ' +
      'มี Redis สำหรับคิวงาน และ Docs portal ที่จำลอง data flow ของทั้งระบบแบบ interactive. ' +
      'สถาปัตยกรรมแบบ microservices รองรับงานแปลจำนวนมากและ trace ได้ตั้งแต่ browser จนถึง GPU.',
    categorySlug: 'ai-product',
    businessTypes: ['ai-product', 'web-app'],
    techSlugs: ['nextjs', 'nestjs', 'bun', 'python', 'supabase', 'redis', 'docker'],
    tagSlugs: ['ai', 'ocr', 'llm', 'translation', 'microservices'],
    isFeatured: true,
    liveUrl: 'https://github.com/Slow-Inc/MangaDock',
    sortOrder: 1,
  },
] as const;

export const services = [
  {
    number: 1,
    title: 'SaaS Platform',
    targetAudience: 'องค์กร/สตาร์ทอัพที่ต้องการระบบ multi-tenant',
    description: 'พัฒนา SaaS ครบวงจร — multi-tenant, subscription, dashboard, การจัดการผู้ใช้และสิทธิ์',
    icon: 'layers',
    sortOrder: 1,
  },
  {
    number: 2,
    title: 'Web Application',
    targetAudience: 'ธุรกิจที่ต้องการระบบเว็บซับซ้อน',
    description: 'ระบบเว็บซับซ้อน เช่น marketplace, ระบบจอง, internal tools ที่ปรับแต่งตามโจทย์',
    icon: 'browser',
    sortOrder: 2,
  },
  {
    number: 3,
    title: 'AI Product',
    targetAudience: 'ธุรกิจที่ต้องการนำ AI มาใช้จริง',
    description: 'chatbot, RAG, OCR/Document AI และ automation — ต่อยอดจากงาน LLM/OCR จริงของทีม',
    icon: 'sparkles',
    sortOrder: 3,
  },
  {
    number: 4,
    title: 'MVP for Startup',
    targetAudience: 'Founder ที่ต้องการ launch/ระดมทุน',
    description: 'สร้าง MVP หรือ product จริงให้เร็ว พร้อม launch และปรับต่อยอดได้',
    icon: 'rocket',
    sortOrder: 4,
  },
  {
    number: 5,
    title: 'Internal System / Automation',
    targetAudience: 'องค์กรที่ต้องการระบบหลังบ้าน',
    description: 'ระบบหลังบ้าน, integration ระหว่างระบบ, และ automation ลดงานซ้ำ',
    icon: 'gear',
    sortOrder: 5,
  },
  {
    number: 6,
    title: 'ปรึกษาโจทย์เฉพาะ',
    targetAudience: 'ทุกคนที่ยังไม่แน่ใจโจทย์',
    description: 'ไม่แน่ใจว่าต้องการอะไร — คุยกับทีมเพื่อออกแบบทางออกทางเทคนิคที่เหมาะกับธุรกิจ',
    icon: 'chat',
    sortOrder: 6,
  },
] as const;

export const faqs = [
  { category: 'timeline', sortOrder: 1, question: 'ใช้เวลาพัฒนาเว็บกี่วัน?', answer: 'ระยะเวลาขึ้นกับขอบเขตงานครับ โปรเจกต์เล็กอาจใช้ไม่กี่สัปดาห์ โปรเจกต์ใหญ่หรือมีฟีเจอร์เยอะอาจใช้ 1–3 เดือน หลังแจ้งความต้องการมา เราจะประเมินและบอกช่วงเวลาโดยประมาณให้ครับ' },
  { category: 'pricing', sortOrder: 2, question: 'ราคาเริ่มต้นประมาณเท่าไหร่?', answer: 'ราคาขึ้นกับประเภทงานและฟีเจอร์ที่ต้องการครับ ตั้งแต่ Landing Page ไปจนถึง SaaS/Web App และ AI Product แนะนำบอกงบเป็นช่วงหรือความต้องการมาได้ เราจะเลือกผลงานที่ใกล้เคียงให้ดูและประเมินราคาให้ครับ' },
  { category: 'scope', sortOrder: 3, question: 'รับทำระบบ AI / chatbot ไหม?', answer: 'รับครับ เราเชี่ยวชาญงาน AI จริง เช่น chatbot, RAG, OCR/Document AI และ automation — ต่อยอดจากผลงานอย่าง MangaDock (OCR + LLM แปลภาพ) ลองถามผู้ช่วย AI ของเราให้แนะนำเคสงานที่เหมาะได้ครับ' },
  { category: 'support', sortOrder: 4, question: 'มีบริการหลังส่งมอบไหม?', answer: 'มีครับ หลังส่งมอบเราพร้อมให้คำปรึกษาและดูแลตามที่ตกลงกัน เช่น แก้ไขข้อความ ปรับรูปแบบเล็กน้อย หรือให้คำแนะนำการใช้งาน ถ้ามีความต้องการเฉพาะสามารถคุยรายละเอียดตอนประเมินงานได้ครับ' },
  { category: 'process', sortOrder: 5, question: 'เริ่มต้นจ้างงานกับ T4 Labs ยังไง?', answer: 'บอกความต้องการได้ 2 ทางครับ — คุยกับผู้ช่วย AI บนเว็บเพื่อประเมินเบื้องต้นและดูผลงานที่ใกล้เคียงทันที หรือทักเราผ่าน Fastwork โดยตรง จากนั้นเราจะสรุปขอบเขตงานและราคาให้พิจารณา' },
  { category: 'payment', sortOrder: 6, question: 'ชำระเงินยังไง ปลอดภัยไหม?', answer: 'เรารับงานผ่าน Fastwork การชำระเงินจึงทำผ่านระบบของ Fastwork ที่คุ้มครองทั้งผู้ว่าจ้างและผู้รับงาน เงินจะถูกปล่อยเมื่องานเป็นไปตามที่ตกลง จึงมั่นใจได้ครับ' },
  { category: 'revision', sortOrder: 7, question: 'แก้ไขงานได้กี่รอบ?', answer: 'เราปรับแก้จนพอใจตามขอบเขตที่ตกลงกันไว้ครับ จำนวนรอบและรายละเอียดการแก้ไขจะระบุชัดเจนตั้งแต่ตอนเสนอราคา เพื่อไม่ให้มีค่าใช้จ่ายงอกระหว่างทาง' },
  { category: 'tech', sortOrder: 8, question: 'ใช้เทคโนโลยีอะไรพัฒนา?', answer: 'เราพัฒนาแบบ Full-Stack ด้วยสแตกสมัยใหม่ — Next.js, Nest.js (TypeScript/Bun), Supabase (PostgreSQL + pgvector), Cloudflare และนำ AI/LLM + RAG มาเสริมเมื่อจำเป็น เน้นความเร็ว ความปลอดภัย สเกลได้ และดูแลต่อง่าย' },
  { category: 'seo', sortOrder: 9, question: 'เว็บรองรับมือถือและทำ SEO ให้ไหม?', answer: 'ทุกเว็บออกแบบให้รองรับมือถือ (Responsive) 100% และวางโครงสร้าง SEO พื้นฐานให้พร้อมติด Google รวมถึง meta และ Open Graph สำหรับแชร์โซเชียลให้สวยงามครับ' },
  { category: 'ownership', sortOrder: 10, question: 'จ้างทำแล้วเป็นเจ้าของเว็บและโค้ดไหม?', answer: 'ใช่ครับ เมื่อส่งมอบงานเรียบร้อยแล้ว เว็บไซต์และโค้ดทั้งหมดเป็นกรรมสิทธิ์ของคุณลูกค้า' },
  { category: 'admin', sortOrder: 11, question: 'มีระบบหลังบ้าน (Admin) ให้จัดการเองไหม?', answer: 'มีครับ เราทำระบบจัดการเนื้อหา สินค้า หรือออเดอร์ให้อัปเดตเองได้ ใช้งานง่าย ไม่ต้องเขียนโค้ด' },
  { category: 'scope', sortOrder: 12, question: 'ทำระบบซับซ้อน เช่น AI ระบบจอง หรือเว็บแอปได้ไหม?', answer: 'ได้ครับ นอกจากเว็บทั่วไป เรารับทำเว็บแอปพลิเคชัน ระบบจอง ระบบสมาชิก แดชบอร์ด และนำ AI มาช่วยงาน เช่น แชทบอทและระบบอัตโนมัติ' },
  { category: 'scope', sortOrder: 13, question: 'รับทำงานประเภทไหนบ้าง?', answer: 'ครบสเปกตรัมครับ ตั้งแต่ Landing Page, เว็บบริษัท/องค์กร, SaaS Platform, Web Application, AI Product ไปจนถึงระบบภายใน/Automation ดูตัวอย่างได้ในหน้าผลงาน' },
  { category: 'about', sortOrder: 14, question: 'ทำไมต้องเลือก T4 Labs?', answer: 'ประสบการณ์ 5 ปี ส่งมอบกว่า 500 โปรเจกต์ คุยกับนักพัฒนาตัวจริงโดยตรง เชี่ยวชาญทั้ง Full-Stack และ AI เน้นผลลัพธ์ต่อธุรกิจ และดูแลต่อหลังส่งมอบ — ได้ทั้งงานคุณภาพและความสบายใจครับ' },
] as const;
