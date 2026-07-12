/**
 * FAQ content (Requirement §4.6). Bilingual (§7.1). Mirrors the backend seed so
 * the AI assistant and the /faq page answer with the same wording.
 */
export interface Faq {
  question: string;
  answer: string;
  questionEn: string;
  answerEn: string;
}

export const faqs: Faq[] = [
  {
    question: 'ใช้เวลาพัฒนาเว็บกี่วัน?',
    answer:
      'ระยะเวลาขึ้นกับขอบเขตงานครับ โปรเจกต์เล็กอาจใช้ไม่กี่สัปดาห์ โปรเจกต์ใหญ่หรือมีฟีเจอร์เยอะอาจใช้ 1–3 เดือน หลังแจ้งความต้องการมา เราจะประเมินและบอกช่วงเวลาโดยประมาณให้ครับ',
    questionEn: 'How long does a build take?',
    answerEn:
      'It depends on scope. Small projects can take a few weeks; larger or feature-rich ones 1–3 months. Once you share your requirements we’ll estimate a timeframe.',
  },
  {
    question: 'ราคาเริ่มต้นประมาณเท่าไหร่?',
    answer:
      'ราคาขึ้นกับประเภทงานและฟีเจอร์ที่ต้องการครับ ตั้งแต่ Landing Page ไปจนถึง SaaS/Web App และ AI Product แนะนำบอกงบเป็นช่วงหรือความต้องการมาได้ เราจะเลือกผลงานที่ใกล้เคียงให้ดูและประเมินราคาให้ครับ',
    questionEn: 'What’s the starting price?',
    answerEn:
      'It depends on the type of work and features — from a landing page to SaaS/Web App and AI products. Share a budget range or your needs and we’ll show similar work and quote you.',
  },
  {
    question: 'รับทำระบบ AI / chatbot ไหม?',
    answer:
      'รับครับ เราเชี่ยวชาญงาน AI จริง เช่น chatbot, RAG, OCR/Document AI และ automation — ต่อยอดจากผลงานอย่าง MangaDock (OCR + LLM แปลภาพ) ลองถามผู้ช่วย AI ของเราให้แนะนำเคสงานที่เหมาะได้ครับ',
    questionEn: 'Do you build AI / chatbots?',
    answerEn:
      'Yes — we specialize in real AI work: chatbots, RAG, OCR/Document AI and automation, building on projects like MangaDock (OCR + LLM image translation). Ask our AI assistant for a fitting case study.',
  },
  {
    question: 'มีบริการหลังส่งมอบไหม?',
    answer:
      'มีครับ หลังส่งมอบเราพร้อมให้คำปรึกษาและดูแลตามที่ตกลงกัน เช่น แก้ไขข้อความ ปรับรูปแบบเล็กน้อย หรือให้คำแนะนำการใช้งาน ถ้ามีความต้องการเฉพาะสามารถคุยรายละเอียดตอนประเมินงานได้ครับ',
    questionEn: 'Is there post-delivery support?',
    answerEn:
      'Yes. After delivery we provide advice and care as agreed — text edits, small tweaks, or usage guidance. Specific needs can be discussed during scoping.',
  },
  {
    question: 'เริ่มต้นจ้างงานกับ T4 Labs ยังไง?',
    answer:
      'บอกความต้องการได้ 2 ทางครับ — คุยกับผู้ช่วย AI บนเว็บเพื่อประเมินเบื้องต้นและดูผลงานที่ใกล้เคียงทันที หรือทักเราผ่าน Fastwork โดยตรง จากนั้นเราจะสรุปขอบเขตงานและราคาให้พิจารณา',
    questionEn: 'How do I start hiring T4 Labs?',
    answerEn:
      'Two ways — chat with the AI assistant for a quick estimate and similar work, or reach us directly on Fastwork. We then summarize scope and price for you.',
  },
  {
    question: 'ชำระเงินยังไง ปลอดภัยไหม?',
    answer:
      'เรารับงานผ่าน Fastwork การชำระเงินจึงทำผ่านระบบของ Fastwork ที่คุ้มครองทั้งผู้ว่าจ้างและผู้รับงาน เงินจะถูกปล่อยเมื่องานเป็นไปตามที่ตกลง จึงมั่นใจได้ครับ',
    questionEn: 'How does payment work — is it safe?',
    answerEn:
      'We work through Fastwork, so payment goes through its escrow that protects both sides. Funds are released when work meets the agreement.',
  },
  {
    question: 'แก้ไขงานได้กี่รอบ?',
    answer:
      'เราปรับแก้จนพอใจตามขอบเขตที่ตกลงกันไว้ครับ จำนวนรอบและรายละเอียดการแก้ไขจะระบุชัดเจนตั้งแต่ตอนเสนอราคา เพื่อไม่ให้มีค่าใช้จ่ายงอกระหว่างทาง',
    questionEn: 'How many revision rounds?',
    answerEn:
      'We revise until you’re happy within the agreed scope. The number of rounds and revision details are stated up front in the quote, so there are no surprise costs.',
  },
  {
    question: 'ใช้เทคโนโลยีอะไรพัฒนา?',
    answer:
      'เราพัฒนาแบบ Full-Stack ด้วยสแตกสมัยใหม่ — Next.js, Nest.js (TypeScript/Bun), Supabase (PostgreSQL + pgvector), Cloudflare และนำ AI/LLM + RAG มาเสริมเมื่อจำเป็น เน้นความเร็ว ความปลอดภัย สเกลได้ และดูแลต่อง่าย',
    questionEn: 'What technologies do you use?',
    answerEn:
      'We build full-stack with a modern stack — Next.js, Nest.js (TypeScript/Bun), Supabase (PostgreSQL + pgvector), Cloudflare, adding AI/LLM + RAG when needed. Focused on speed, security, scale and maintainability.',
  },
  {
    question: 'เว็บรองรับมือถือและทำ SEO ให้ไหม?',
    answer:
      'ทุกเว็บออกแบบให้รองรับมือถือ (Responsive) 100% และวางโครงสร้าง SEO พื้นฐานให้พร้อมติด Google รวมถึง meta และ Open Graph สำหรับแชร์โซเชียลให้สวยงามครับ',
    questionEn: 'Is it mobile-friendly and SEO-ready?',
    answerEn:
      'Every site is 100% responsive with baseline SEO ready for Google, including meta tags and Open Graph for clean social sharing.',
  },
  {
    question: 'จ้างทำแล้วเป็นเจ้าของเว็บและโค้ดไหม?',
    answer:
      'ใช่ครับ เมื่อส่งมอบงานเรียบร้อยแล้ว เว็บไซต์และโค้ดทั้งหมดเป็นกรรมสิทธิ์ของคุณลูกค้า',
    questionEn: 'Do I own the site and code?',
    answerEn: 'Yes — once delivered, the website and all source code are yours.',
  },
  {
    question: 'มีระบบหลังบ้าน (Admin) ให้จัดการเองไหม?',
    answer:
      'มีครับ เราทำระบบจัดการเนื้อหา สินค้า หรือออเดอร์ให้อัปเดตเองได้ ใช้งานง่าย ไม่ต้องเขียนโค้ด',
    questionEn: 'Is there an admin panel I can manage?',
    answerEn:
      'Yes — we build an admin to manage content, products or orders yourself, easy to use with no coding.',
  },
  {
    question: 'ทำระบบซับซ้อน เช่น AI ระบบจอง หรือเว็บแอปได้ไหม?',
    answer:
      'ได้ครับ นอกจากเว็บทั่วไป เรารับทำเว็บแอปพลิเคชัน ระบบจอง ระบบสมาชิก แดชบอร์ด และนำ AI มาช่วยงาน เช่น แชทบอทและระบบอัตโนมัติ',
    questionEn: 'Can you build complex systems (AI, booking, web apps)?',
    answerEn:
      'Yes — beyond regular sites we build web apps, booking and membership systems, dashboards, and add AI such as chatbots and automation.',
  },
  {
    question: 'รับทำงานประเภทไหนบ้าง?',
    answer:
      'ครบสเปกตรัมครับ ตั้งแต่ Landing Page, เว็บบริษัท/องค์กร, SaaS Platform, Web Application, AI Product ไปจนถึงระบบภายใน/Automation ดูตัวอย่างได้ในหน้าผลงาน',
    questionEn: 'What types of work do you take on?',
    answerEn:
      'The full spectrum — landing pages, company sites, SaaS platforms, web applications, AI products, through to internal systems/automation. See examples on the work page.',
  },
  {
    question: 'ทำไมต้องเลือก T4 Labs?',
    answer:
      'ประสบการณ์กว่า 20 ปี ส่งมอบกว่า 500 โปรเจกต์ คุยกับนักพัฒนาตัวจริงโดยตรง เชี่ยวชาญทั้ง Full-Stack และ AI เน้นผลลัพธ์ต่อธุรกิจ และดูแลต่อหลังส่งมอบ — ได้ทั้งงานคุณภาพและความสบายใจครับ',
    questionEn: 'Why choose T4 Labs?',
    answerEn:
      '20+ years of experience, 500+ projects delivered, talk to real engineers directly, expertise across Full-Stack and AI, focused on business outcomes and post-delivery care — quality work with peace of mind.',
  },
];
