-- AI display-ranking (spec 2026-07-15, Epic B), additive/idempotent.
-- Apply against the Supabase project this repo talks to — not run automatically.
-- `ai_rank` (lower = higher priority) is computed offline by RankService; a human
-- pin (sort_order) wins at the read path (D1). Nullable → safe on populated tables.
alter table public.certificates
  add column if not exists ai_rank integer,
  add column if not exists ai_rank_rationale text;

alter table public.blog_posts
  add column if not exists ai_rank integer,
  add column if not exists ai_rank_rationale text;
