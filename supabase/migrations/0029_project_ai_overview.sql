-- D3 (#130): structured AI overview card fields on projects.
-- Additive / idempotent. Do NOT apply to production until explicitly authorized.

alter table public.projects
  add column if not exists overview_summary text,
  add column if not exists overview_highlights text,
  add column if not exists overview_good_for text,
  add column if not exists overview_summary_en text,
  add column if not exists overview_highlights_en text,
  add column if not exists overview_good_for_en text,
  add column if not exists overview_owner text not null default 'auto';

comment on column public.projects.overview_summary is
  'AI overview card — what the project is (TH); D3 #130';
comment on column public.projects.overview_owner is
  'auto|human provenance for the overview card block; regeneration only when auto';
