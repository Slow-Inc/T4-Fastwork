-- Security fix (scrutinize/pre-merge, HIGH): projects/services/faqs/certificates and the
-- taxonomy lookups had NO RLS + default authenticated write grants, so any signed-in
-- member could write them DIRECTLY via PostgREST (supabase.from('projects').insert(...)),
-- bypassing the admin Server Actions entirely — public-content defacement. Enable RLS:
-- public reads unchanged, writes restricted to admins (is_app_admin). The admin cookie
-- client (is_app_admin) writes via the policy; the backend superuser pooler bypasses RLS
-- for GitHub sync / ranking.

do $$
declare t text;
begin
  foreach t in array array['services','faqs','categories','technologies','tags','certificates']
  loop
    execute format('alter table public.%I enable row level security', t);
    execute format($p$create policy "public read %1$s" on public.%1$I for select using (true)$p$, t);
    execute format($p$create policy "admin writes %1$s" on public.%1$I for all to authenticated using (public.is_app_admin()) with check (public.is_app_admin())$p$, t);
  end loop;
end $$;

-- projects has a draft/status concept: the public sees only published; admins see all.
alter table public.projects enable row level security;
create policy "public read published projects" on public.projects
  for select using (status = 'published' or public.is_app_admin());
create policy "admin writes projects" on public.projects
  for all to authenticated using (public.is_app_admin()) with check (public.is_app_admin());
