-- D4 (#131): per-technology "used for" descriptions (global on technologies).
-- Additive / idempotent. Do NOT apply to production until explicitly authorized.

alter table public.technologies
  add column if not exists used_for text,
  add column if not exists used_for_en text,
  add column if not exists used_for_owner text not null default 'auto';

comment on column public.technologies.used_for is
  'Short AI/admin blurb: what this technology is used for (TH); D4 #131';
comment on column public.technologies.used_for_owner is
  'auto|human provenance; regeneration only when auto';
