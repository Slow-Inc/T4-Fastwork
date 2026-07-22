-- T1.1/T1.2 seed: run after migration 0026 and before enabling DB-first reads.
-- Idempotent by the stable Thai FAQ question / service number. Existing rows
-- keep their non-null English copy; missing translations are filled only once.

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
  answer_en = coalesce(answer_en, 'Two ways — chat with the AI assistant on the site for an initial assessment and similar work, or contact us through Fastwork. We will then summarize the scope and quote for your review.')
where question = 'เริ่มต้นจ้างงานกับ T4 Labs ยังไง?';

insert into public.faqs (category, sort_order, question, answer, question_en, answer_en)
select 'timeline', 1, 'ใช้เวลาพัฒนาเว็บกี่วัน?',
  'ระยะเวลาขึ้นกับขอบเขตงานครับ โปรเจกต์เล็กอาจใช้ไม่กี่สัปดาห์ โปรเจกต์ใหญ่หรือมีฟีเจอร์เยอะอาจใช้ 1–3 เดือน หลังแจ้งความต้องการมา เราจะประเมินและบอกช่วงเวลาโดยประมาณให้ครับ',
  'How long does a build take?',
  'It depends on scope. Small projects can take a few weeks; larger or feature-rich ones 1–3 months. Once you share your requirements we’ll estimate a timeframe.'
where not exists (select 1 from public.faqs where question = 'ใช้เวลาพัฒนาเว็บกี่วัน?');
insert into public.faqs (category, sort_order, question, answer, question_en, answer_en)
select 'pricing', 2, 'ราคาเริ่มต้นประมาณเท่าไหร่?',
  'ราคาขึ้นกับประเภทงานและฟีเจอร์ที่ต้องการครับ ตั้งแต่ Landing Page ไปจนถึง SaaS/Web App และ AI Product แนะนำบอกงบเป็นช่วงหรือความต้องการมาได้ เราจะเลือกผลงานที่ใกล้เคียงให้ดูและประเมินราคาให้ครับ',
  'What’s the starting price?',
  'It depends on the type of work and features — from a landing page to SaaS/Web App and AI products. Share a budget range or your needs and we’ll show similar work and quote you.'
where not exists (select 1 from public.faqs where question = 'ราคาเริ่มต้นประมาณเท่าไหร่?');
insert into public.faqs (category, sort_order, question, answer, question_en, answer_en)
select 'scope', 3, 'รับทำระบบ AI / chatbot ไหม?',
  'รับครับ เราเชี่ยวชาญงาน AI จริง เช่น chatbot, RAG, OCR/Document AI และ automation — ต่อยอดจากผลงานอย่าง MangaDock (OCR + LLM แปลภาพ) ลองถามผู้ช่วย AI ของเราให้แนะนำเคสงานที่เหมาะได้ครับ',
  'Do you build AI / chatbots?',
  'Yes — we specialize in real AI work: chatbots, RAG, OCR/Document AI and automation, building on projects like MangaDock (OCR + LLM image translation). Ask our AI assistant for a fitting case study.'
where not exists (select 1 from public.faqs where question = 'รับทำระบบ AI / chatbot ไหม?');
insert into public.faqs (category, sort_order, question, answer, question_en, answer_en)
select 'support', 4, 'มีบริการหลังส่งมอบไหม?',
  'มีครับ หลังส่งมอบเราพร้อมให้คำปรึกษาและดูแลตามที่ตกลง เช่น แก้ไขข้อความ ปรับรูปแบบเล็กน้อย หรือให้คำแนะนำการใช้งาน ถ้ามีความต้องการเฉพาะสามารถคุยรายละเอียดตอนประเมินงานได้ครับ',
  'Is there post-delivery support?',
  'Yes. After delivery we provide advice and care as agreed — text edits, small tweaks, or usage guidance. Specific needs can be discussed during scoping.'
where not exists (select 1 from public.faqs where question = 'มีบริการหลังส่งมอบไหม?');
insert into public.faqs (category, sort_order, question, answer, question_en, answer_en)
select 'process', 5, 'เริ่มต้นจ้างงานกับ T4 Labs ยังไง?',
  'บอกความต้องการได้ 2 ทางครับ — คุยกับผู้ช่วย AI บนเว็บเพื่อประเมินเบื้องต้นและดูผลงานที่ใกล้เคียงทันที หรือทักเราผ่าน Fastwork โดยตรง จากนั้นเราจะสรุปขอบเขตงานและราคาให้พิจารณา',
  'How do I start hiring T4 Labs?',
  'Two ways — chat with the AI assistant on the site for an initial assessment and similar work, or contact us through Fastwork. We will then summarize the scope and quote for your review.'
where not exists (select 1 from public.faqs where question = 'เริ่มต้นจ้างงานกับ T4 Labs ยังไง?');

update public.services set title = 'Landing Page', description = 'เว็บ launch โปรดักต์ เน้นเร็ว โหลดไว SEO ดี',
  description_en = coalesce(description_en, 'Launch sites — fast, light, SEO-ready') where number = 1;
update public.services set title = 'Web Application', description = 'ระบบซับซ้อน auth + realtime + dashboard',
  description_en = coalesce(description_en, 'Complex systems — auth + realtime + dashboard') where number = 2;
update public.services set title = 'SaaS Platform', description = 'multi-tenant · billing · analytics · สเกลใหญ่',
  description_en = coalesce(description_en, 'multi-tenant · billing · analytics · scale') where number = 3;
update public.services set title = 'AI Product', description = 'chatbot · RAG · Document AI · automation',
  description_en = coalesce(description_en, 'chatbot · RAG · Document AI · automation') where number = 4;
update public.services set title = 'Mobile App', description = 'Flutter / React Native — iOS + Android',
  description_en = coalesce(description_en, 'Flutter / React Native — iOS + Android') where number = 5;

insert into public.services (number, title, description, description_en, sort_order)
select 1, 'Landing Page', 'เว็บ launch โปรดักต์ เน้นเร็ว โหลดไว SEO ดี', 'Launch sites — fast, light, SEO-ready', 1
where not exists (select 1 from public.services where number = 1);
insert into public.services (number, title, description, description_en, sort_order)
select 2, 'Web Application', 'ระบบซับซ้อน auth + realtime + dashboard', 'Complex systems — auth + realtime + dashboard', 2
where not exists (select 1 from public.services where number = 2);
insert into public.services (number, title, description, description_en, sort_order)
select 3, 'SaaS Platform', 'multi-tenant · billing · analytics · สเกลใหญ่', 'multi-tenant · billing · analytics · scale', 3
where not exists (select 1 from public.services where number = 3);
insert into public.services (number, title, description, description_en, sort_order)
select 4, 'AI Product', 'chatbot · RAG · Document AI · automation', 'chatbot · RAG · Document AI · automation', 4
where not exists (select 1 from public.services where number = 4);
insert into public.services (number, title, description, description_en, sort_order)
select 5, 'Mobile App', 'Flutter / React Native — iOS + Android', 'Flutter / React Native — iOS + Android', 5
where not exists (select 1 from public.services where number = 5);
