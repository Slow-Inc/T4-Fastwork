-- B5: seed the 8 static showcase projects (nextjs/content/catalog.ts) into `projects`
-- as rank-holders so the AI display-rank job can score them. The frontend keeps
-- rendering the static catalog CONTENT (tone/i18n/category parity preserved) and only
-- reads the resulting ai_rank to ORDER Featured / Selected-work / /projects.
-- Idempotent (upsert by slug); never clobbers ai_rank.
insert into projects (slug, title, title_en, description, is_featured, published_at, sort_order, source, status) values
  ('mangadock',    'MangaDock',      'MangaDock',      'แพลตฟอร์มอ่าน/แปลมังงะด้วย AI — OCR ข้อความในภาพ แปล และประกอบกลับแบบอัตโนมัติ', true,  '2025-01-01', 0, 'cms', 'published'),
  ('listingthai',  'ListingThai',    'ListingThai',    'มาร์เก็ตเพลสอสังหาริมทรัพย์ — ค้นหา กรอง และลงประกาศพร้อมแดชบอร์ดเอเจนต์',       true,  '2024-01-01', 1, 'cms', 'published'),
  ('powernics',    'Powernics',      'Powernics',      'แพลตฟอร์มติดตามระบบโซลาร์ — มอนิเตอร์การผลิตไฟฟ้าแบบเรียลไทม์และรายงาน',        true,  '2024-01-01', 2, 'cms', 'published'),
  ('ghost-maps',   'The Ghost Maps', 'The Ghost Maps', 'แอปสำรวจสถานที่แบบเรียลไทม์ — พิกัด รีวิว และการแชร์ตำแหน่งสด',                 false, '2025-01-01', 3, 'cms', 'published'),
  ('clinic-flow',  'ClinicFlow',     'ClinicFlow',     'ระบบจองคิวและจัดการคลินิก — นัดหมาย เวชระเบียน และแจ้งเตือนผ่าน LINE',           false, '2024-01-01', 4, 'cms', 'published'),
  ('stockpilot',   'StockPilot',     'StockPilot',     'ระบบจัดการสต็อกและคลังสินค้าภายในองค์กร — CRUD, บาร์โค้ด และรายงาน',            false, '2023-01-01', 5, 'cms', 'published'),
  ('docai-extract','DocAI Extract',  'DocAI Extract',  'บริการดึงข้อมูลจากเอกสารด้วย AI — OCR ใบเสร็จ/สัญญา และส่งออกแบบมีโครงสร้าง',    false, '2025-01-01', 6, 'cms', 'published'),
  ('eduportal',    'EduPortal',      'EduPortal',      'แพลตฟอร์มการเรียนออนไลน์แบบ multi-tenant — คอร์ส วิดีโอ และการชำระเงิน',        false, '2023-01-01', 7, 'cms', 'published')
on conflict (slug) do update set
  title = excluded.title,
  title_en = excluded.title_en,
  description = excluded.description,
  is_featured = excluded.is_featured,
  published_at = excluded.published_at,
  status = 'published';
