-- Lead/ContactClick analytics (Requirement §6.7), additive/idempotent.
-- Apply against the Supabase project this repo talks to — not run automatically.
create table if not exists public.cta_clicks (
  id bigint generated always as identity primary key,
  source_page text not null,
  cta_type text not null,
  created_at timestamptz not null default now()
);

alter table public.cta_clicks enable row level security;

drop policy if exists "anon can insert cta_clicks" on public.cta_clicks;
create policy "anon can insert cta_clicks"
  on public.cta_clicks for insert
  to anon
  with check (true);
