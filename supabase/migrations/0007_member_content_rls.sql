-- Epic C foundation: RLS + public read for the migrated member/team showcase content
-- (tables created by Drizzle migration 0006). Backend seed/writes go through the
-- superuser pooler (bypasses RLS). The frontend reads via the anon publishable key,
-- so anon needs SELECT — scoped by RLS so drafts (member_certificates.status) and
-- unselected repos (member_projects.selected) stay hidden until published/selected.
-- Member/admin write policies come with C3/C4.

alter table public.member_projects enable row level security;
alter table public.member_certificates enable row level security;
alter table public.team_projects enable row level security;

grant select on public.member_projects to anon, authenticated;
grant select on public.member_certificates to anon, authenticated;
grant select on public.team_projects to anon, authenticated;

create policy "public read selected member projects"
  on public.member_projects for select
  using (selected = true);

create policy "public read published member certificates"
  on public.member_certificates for select
  using (status = 'published');

create policy "public read team projects"
  on public.team_projects for select
  using (true);
