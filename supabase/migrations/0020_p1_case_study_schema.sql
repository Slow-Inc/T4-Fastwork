-- P1 (#64 · ADR 0009 D1): case-study schema foundation.
-- Additive only. blog_posts already exists (was Supabase-only) — we ALTER it, never recreate.
-- Provenance: a single `owner` column for the MVP (developer decision Q4); the immutable
-- blog_post_revisions + field-level blog_post_overrides are deferred to P4 (#67).

-- 1) blog_posts: link a post to a project + carry audience/kind/source/owner.
alter table public.blog_posts
  add column if not exists project_id integer references public.projects(id) on delete set null,
  add column if not exists audience text,                        -- 'business' | 'semitech' | 'developer' (null for a manual post)
  add column if not exists kind text not null default 'manual',  -- 'manual' | 'case_study' | 'deep_dive'
  add column if not exists source text not null default 'cms',   -- 'cms' | 'github'
  add column if not exists owner text not null default 'human';  -- 'auto' | 'human' (regeneration only rewrites 'auto')

-- One live case study per project per audience (partial: existing manual posts are unaffected).
create unique index if not exists blog_posts_project_audience_case_study
  on public.blog_posts (project_id, audience)
  where kind = 'case_study';

-- 2) project_documents: the per-file Markdown manifest. blob_sha drives incremental regen
--    (only re-map a file whose sha changed); deleted_at marks a removed file.
create table if not exists public.project_documents (
  project_id integer not null references public.projects(id) on delete cascade,
  path text not null,
  blob_sha text not null,
  content_hash text,
  markdown text,
  last_seen_commit text,
  deleted_at timestamptz,
  updated_at timestamptz not null default now(),
  primary key (project_id, path)
);

-- 3) generation_jobs: idempotent job ledger — skip an unchanged manifest+prompt_version.
create table if not exists public.generation_jobs (
  id serial primary key,
  project_id integer not null references public.projects(id) on delete cascade,
  input_manifest_hash text not null,
  prompt_version text not null,
  status text not null default 'pending',  -- 'pending' | 'running' | 'done' | 'failed'
  attempts integer not null default 0,
  error text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (project_id, input_manifest_hash, prompt_version)
);

-- 4) RLS (ADR 0007): both are backend-only (written via the superuser pooler, which bypasses
--    RLS); lock them from the anon/authenticated PostgREST roles, with an is_app_admin() read
--    policy for the admin dashboard — the same posture as migration 0018.
alter table public.project_documents enable row level security;
alter table public.generation_jobs enable row level security;
revoke all on public.project_documents from anon, authenticated;
revoke all on public.generation_jobs from anon, authenticated;
grant select on public.project_documents to authenticated;
grant select on public.generation_jobs to authenticated;
create policy "admin read project_documents"
  on public.project_documents for select to authenticated using (public.is_app_admin());
create policy "admin read generation_jobs"
  on public.generation_jobs for select to authenticated using (public.is_app_admin());
