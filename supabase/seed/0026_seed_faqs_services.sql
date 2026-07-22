-- T1.1 seed: bilingual EN for the public FAQ rows. Run after migration 0026.
-- Idempotent: matches an existing FAQ by its (stable) Thai question and fills EN
-- only when still null (coalesce); the INSERT-where-not-exists block reseeds the
-- base set on a FRESH database. Safe to re-run.
--
-- NOTE (reviewed 2026-07-23): the SERVICES table is NOT seeded here. Production
-- `public.services` is admin-curated (SaaS Platform / Web Application / AI Product /
-- MVP for Startup / Internal System / ปรึกษาโจทย์เฉพาะ) and does NOT match the stale
-- `nextjs/content/services.ts` (Landing Page / Web App / SaaS / AI / Mobile). Seeding
-- the static titles would OVERWRITE the real curated rows. `services-repo` reads the
-- real rows; `description_en` stays null → EN falls back to TH until an admin adds it.
-- (Follow-up: refresh the stale static services.ts fallback, or add EN via the CMS.)

-- ── FAQ: fill EN on the 14 existing rows (match by Thai question) ─────────────
update public.faqs set question_en = coalesce(question_en, 'How long does a build take?'),
  answer_en = coalesce(answer_en, 'It depends on scope. Small projects can take a few weeks; larger or feature-rich ones 1–3 months. Once you share your requirements we’ll estimate a timeframe.')
  where question = 'ใช้เวลาพัฒนาเว็บกี่วัน?';
update public.faqs set question_en = coalesce(question_en, 'What’s the starting price?'),
  answer_en = coalesce(answer_en, 'It depends on the type of work and features — from a landing page to SaaS/Web App and AI products. Share a budget range or your needs and we’ll show similar work and quote you.')
  where question = 'ราคาเริ่มต้นประมาณเท่าไหร่?';
update public.faqs set question_en = coalesce(question_en, 'Do you build AI / chatbots?'),
  answer_en = coalesce(answer_en, 'Yes — we specialize in real AI work: chatbots, RAG, OCR/Document AI and automation, building on projects like MangaDock (OCR + LLM image translation). Ask our AI assistant for a fitting case study.')
  where question = 'รับทำระบบ AI / chatbot ไหม?';
update public.faqs set question_en = coalesce(question_en, 'Is there post-delivery support?'),
  answer_en = coalesce(answer_en, 'Yes. After delivery we provide advice and care as agreed — text edits, small tweaks, or usage guidance. Specific needs can be discussed during scoping.')
  where question = 'มีบริการหลังส่งมอบไหม?';
update public.faqs set question_en = coalesce(question_en, 'How do I start hiring T4 Labs?'),
  answer_en = coalesce(answer_en, 'Two ways — chat with the AI assistant for a quick estimate and similar work, or reach us directly on Fastwork. We then summarize scope and price for you.')
  where question = 'เริ่มต้นจ้างงานกับ T4 Labs ยังไง?';
update public.faqs set question_en = coalesce(question_en, 'How does payment work — is it safe?'),
  answer_en = coalesce(answer_en, 'We work through Fastwork, so payment goes through its escrow that protects both sides. Funds are released when work meets the agreement.')
  where question = 'ชำระเงินยังไง ปลอดภัยไหม?';
update public.faqs set question_en = coalesce(question_en, 'How many revision rounds?'),
  answer_en = coalesce(answer_en, 'We revise until you’re happy within the agreed scope. The number of rounds and revision details are stated up front in the quote, so there are no surprise costs.')
  where question = 'แก้ไขงานได้กี่รอบ?';
update public.faqs set question_en = coalesce(question_en, 'What technologies do you use?'),
  answer_en = coalesce(answer_en, 'We build full-stack with a modern stack — Next.js, Nest.js (TypeScript/Bun), Supabase (PostgreSQL + pgvector), Cloudflare, adding AI/LLM + RAG when needed. Focused on speed, security, scale and maintainability.')
  where question = 'ใช้เทคโนโลยีอะไรพัฒนา?';
update public.faqs set question_en = coalesce(question_en, 'Is it mobile-friendly and SEO-ready?'),
  answer_en = coalesce(answer_en, 'Every site is 100% responsive with baseline SEO ready for Google, including meta tags and Open Graph for clean social sharing.')
  where question = 'เว็บรองรับมือถือและทำ SEO ให้ไหม?';
update public.faqs set question_en = coalesce(question_en, 'Do I own the site and code?'),
  answer_en = coalesce(answer_en, 'Yes — once delivered, the website and all source code are yours.')
  where question = 'จ้างทำแล้วเป็นเจ้าของเว็บและโค้ดไหม?';
update public.faqs set question_en = coalesce(question_en, 'Is there an admin panel I can manage?'),
  answer_en = coalesce(answer_en, 'Yes — we build an admin to manage content, products or orders yourself, easy to use with no coding.')
  where question = 'มีระบบหลังบ้าน (Admin) ให้จัดการเองไหม?';
update public.faqs set question_en = coalesce(question_en, 'Can you build complex systems (AI, booking, web apps)?'),
  answer_en = coalesce(answer_en, 'Yes — beyond regular sites we build web apps, booking and membership systems, dashboards, and add AI such as chatbots and automation.')
  where question = 'ทำระบบซับซ้อน เช่น AI ระบบจอง หรือเว็บแอปได้ไหม?';
update public.faqs set question_en = coalesce(question_en, 'What types of work do you take on?'),
  answer_en = coalesce(answer_en, 'The full spectrum — landing pages, company sites, SaaS platforms, web applications, AI products, through to internal systems/automation. See examples on the work page.')
  where question = 'รับทำงานประเภทไหนบ้าง?';
update public.faqs set question_en = coalesce(question_en, 'Why choose T4 Labs?'),
  answer_en = coalesce(answer_en, '7 years of experience, 21+ projects built, talk to real engineers directly, expertise across Full-Stack and AI, focused on business outcomes and post-delivery care — quality work with peace of mind.')
  where question = 'ทำไมต้องเลือก T4 Labs?';

-- ── FRESH-DB reseed (no-op when the row already exists) ──────────────────────
insert into public.faqs (category, sort_order, question, answer, question_en, answer_en)
select v.category, v.sort_order, v.question, v.answer, v.question_en, v.answer_en
from (values
  ('timeline', 1, 'ใช้เวลาพัฒนาเว็บกี่วัน?', 'ระยะเวลาขึ้นกับขอบเขตงานครับ โปรเจกต์เล็กอาจใช้ไม่กี่สัปดาห์ โปรเจกต์ใหญ่หรือมีฟีเจอร์เยอะอาจใช้ 1–3 เดือน หลังแจ้งความต้องการมา เราจะประเมินและบอกช่วงเวลาโดยประมาณให้ครับ', 'How long does a build take?', 'It depends on scope. Small projects can take a few weeks; larger or feature-rich ones 1–3 months. Once you share your requirements we’ll estimate a timeframe.'),
  ('pricing', 2, 'ราคาเริ่มต้นประมาณเท่าไหร่?', 'ราคาขึ้นกับประเภทงานและฟีเจอร์ที่ต้องการครับ ตั้งแต่ Landing Page ไปจนถึง SaaS/Web App และ AI Product แนะนำบอกงบเป็นช่วงหรือความต้องการมาได้ เราจะเลือกผลงานที่ใกล้เคียงให้ดูและประเมินราคาให้ครับ', 'What’s the starting price?', 'It depends on the type of work and features — from a landing page to SaaS/Web App and AI products. Share a budget range or your needs and we’ll show similar work and quote you.'),
  ('scope', 3, 'รับทำระบบ AI / chatbot ไหม?', 'รับครับ เราเชี่ยวชาญงาน AI จริง เช่น chatbot, RAG, OCR/Document AI และ automation — ต่อยอดจากผลงานอย่าง MangaDock (OCR + LLM แปลภาพ) ลองถามผู้ช่วย AI ของเราให้แนะนำเคสงานที่เหมาะได้ครับ', 'Do you build AI / chatbots?', 'Yes — we specialize in real AI work: chatbots, RAG, OCR/Document AI and automation, building on projects like MangaDock (OCR + LLM image translation). Ask our AI assistant for a fitting case study.'),
  ('support', 4, 'มีบริการหลังส่งมอบไหม?', 'มีครับ หลังส่งมอบเราพร้อมให้คำปรึกษาและดูแลตามที่ตกลงกัน เช่น แก้ไขข้อความ ปรับรูปแบบเล็กน้อย หรือให้คำแนะนำการใช้งาน ถ้ามีความต้องการเฉพาะสามารถคุยรายละเอียดตอนประเมินงานได้ครับ', 'Is there post-delivery support?', 'Yes. After delivery we provide advice and care as agreed — text edits, small tweaks, or usage guidance. Specific needs can be discussed during scoping.'),
  ('process', 5, 'เริ่มต้นจ้างงานกับ T4 Labs ยังไง?', 'บอกความต้องการได้ 2 ทางครับ — คุยกับผู้ช่วย AI บนเว็บเพื่อประเมินเบื้องต้นและดูผลงานที่ใกล้เคียงทันที หรือทักเราผ่าน Fastwork โดยตรง จากนั้นเราจะสรุปขอบเขตงานและราคาให้พิจารณา', 'How do I start hiring T4 Labs?', 'Two ways — chat with the AI assistant for a quick estimate and similar work, or reach us directly on Fastwork. We then summarize scope and price for you.'),
  ('payment', 6, 'ชำระเงินยังไง ปลอดภัยไหม?', 'เรารับงานผ่าน Fastwork การชำระเงินจึงทำผ่านระบบของ Fastwork ที่คุ้มครองทั้งผู้ว่าจ้างและผู้รับงาน เงินจะถูกปล่อยเมื่องานเป็นไปตามที่ตกลง จึงมั่นใจได้ครับ', 'How does payment work — is it safe?', 'We work through Fastwork, so payment goes through its escrow that protects both sides. Funds are released when work meets the agreement.'),
  ('revision', 7, 'แก้ไขงานได้กี่รอบ?', 'เราปรับแก้จนพอใจตามขอบเขตที่ตกลงกันไว้ครับ จำนวนรอบและรายละเอียดการแก้ไขจะระบุชัดเจนตั้งแต่ตอนเสนอราคา เพื่อไม่ให้มีค่าใช้จ่ายงอกระหว่างทาง', 'How many revision rounds?', 'We revise until you’re happy within the agreed scope. The number of rounds and revision details are stated up front in the quote, so there are no surprise costs.'),
  ('tech', 8, 'ใช้เทคโนโลยีอะไรพัฒนา?', 'เราพัฒนาแบบ Full-Stack ด้วยสแตกสมัยใหม่ — Next.js, Nest.js (TypeScript/Bun), Supabase (PostgreSQL + pgvector), Cloudflare และนำ AI/LLM + RAG มาเสริมเมื่อจำเป็น เน้นความเร็ว ความปลอดภัย สเกลได้ และดูแลต่อง่าย', 'What technologies do you use?', 'We build full-stack with a modern stack — Next.js, Nest.js (TypeScript/Bun), Supabase (PostgreSQL + pgvector), Cloudflare, adding AI/LLM + RAG when needed. Focused on speed, security, scale and maintainability.'),
  ('seo', 9, 'เว็บรองรับมือถือและทำ SEO ให้ไหม?', 'ทุกเว็บออกแบบให้รองรับมือถือ (Responsive) 100% และวางโครงสร้าง SEO พื้นฐานให้พร้อมติด Google รวมถึง meta และ Open Graph สำหรับแชร์โซเชียลให้สวยงามครับ', 'Is it mobile-friendly and SEO-ready?', 'Every site is 100% responsive with baseline SEO ready for Google, including meta tags and Open Graph for clean social sharing.'),
  ('ownership', 10, 'จ้างทำแล้วเป็นเจ้าของเว็บและโค้ดไหม?', 'ใช่ครับ เมื่อส่งมอบงานเรียบร้อยแล้ว เว็บไซต์และโค้ดทั้งหมดเป็นกรรมสิทธิ์ของคุณลูกค้า', 'Do I own the site and code?', 'Yes — once delivered, the website and all source code are yours.'),
  ('admin', 11, 'มีระบบหลังบ้าน (Admin) ให้จัดการเองไหม?', 'มีครับ เราทำระบบจัดการเนื้อหา สินค้า หรือออเดอร์ให้อัปเดตเองได้ ใช้งานง่าย ไม่ต้องเขียนโค้ด', 'Is there an admin panel I can manage?', 'Yes — we build an admin to manage content, products or orders yourself, easy to use with no coding.'),
  ('scope', 12, 'ทำระบบซับซ้อน เช่น AI ระบบจอง หรือเว็บแอปได้ไหม?', 'ได้ครับ นอกจากเว็บทั่วไป เรารับทำเว็บแอปพลิเคชัน ระบบจอง ระบบสมาชิก แดชบอร์ด และนำ AI มาช่วยงาน เช่น แชทบอทและระบบอัตโนมัติ', 'Can you build complex systems (AI, booking, web apps)?', 'Yes — beyond regular sites we build web apps, booking and membership systems, dashboards, and add AI such as chatbots and automation.'),
  ('scope', 13, 'รับทำงานประเภทไหนบ้าง?', 'ครบสเปกตรัมครับ ตั้งแต่ Landing Page, เว็บบริษัท/องค์กร, SaaS Platform, Web Application, AI Product ไปจนถึงระบบภายใน/Automation ดูตัวอย่างได้ในหน้าผลงาน', 'What types of work do you take on?', 'The full spectrum — landing pages, company sites, SaaS platforms, web applications, AI products, through to internal systems/automation. See examples on the work page.'),
  ('about', 14, 'ทำไมต้องเลือก T4 Labs?', 'ประสบการณ์ 7 ปี ทำมาแล้ว 21+ โปรเจกต์ คุยกับนักพัฒนาตัวจริงโดยตรง เชี่ยวชาญทั้ง Full-Stack และ AI เน้นผลลัพธ์ต่อธุรกิจ และดูแลต่อหลังส่งมอบ — ได้ทั้งงานคุณภาพและความสบายใจครับ', 'Why choose T4 Labs?', '7 years of experience, 21+ projects built, talk to real engineers directly, expertise across Full-Stack and AI, focused on business outcomes and post-delivery care — quality work with peace of mind.')
) as v(category, sort_order, question, answer, question_en, answer_en)
where not exists (select 1 from public.faqs f where f.question = v.question);
