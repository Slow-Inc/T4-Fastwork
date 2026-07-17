-- Backfill: github_snapshots RLS + its public-read policy were applied directly to
-- prod (ADR 0003) but never committed as a migration, so a DB rebuilt from this repo
-- would not reproduce them. This migration makes the committed set match prod.
-- Idempotent (safe to re-apply). github_snapshots holds public showcase data, so the
-- policy is an unrestricted read for anon + authenticated; backend writes go through
-- the superuser pooler (bypasses RLS).
alter table public.github_snapshots enable row level security;

drop policy if exists "github_snapshots public read" on public.github_snapshots;
create policy "github_snapshots public read" on public.github_snapshots
  for select to anon, authenticated using (true);
