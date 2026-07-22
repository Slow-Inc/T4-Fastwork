-- Wave 1 T1.1/T1.2: bilingual public FAQ and service content.
-- Additive and idempotent. The seed is intentionally separate so it can be
-- run before the DB-first read cutover through the supported path.
alter table public.faqs
  add column if not exists question_en text,
  add column if not exists answer_en text;

alter table public.services
  add column if not exists description_en text;

-- 0016 already installs permissive public-read policies; keep the grants
-- explicit for rebuilt databases and do not widen authenticated writes here.
grant select on public.faqs to anon;
grant select on public.services to anon;
