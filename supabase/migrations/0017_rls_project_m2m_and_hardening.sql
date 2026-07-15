-- Security fix (scrutinize follow-up): the projects M2M join tables had no RLS either,
-- so a member could rewrite project↔tag / project↔technology links directly via PostgREST.
-- Same posture as projects: public read, admin-only write.
do $$
declare t text;
begin
  foreach t in array array['project_tags','project_technologies']
  loop
    execute format('alter table public.%I enable row level security', t);
    execute format($p$create policy "public read %1$s" on public.%1$I for select using (true)$p$, t);
    execute format($p$create policy "admin writes %1$s" on public.%1$I for all to authenticated using (public.is_app_admin()) with check (public.is_app_admin())$p$, t);
  end loop;
end $$;

-- Hardening: pin the members provenance trigger's search_path (advisor 0011).
alter function public.members_flag_human_edits() set search_path = public;

-- Hardening: the admin-only RPCs are self-gated (is_app_admin), but anon has no reason to
-- reach them — reduce surface. (is_app_admin stays anon-executable: RLS policies call it.)
revoke execute on function public.admin_set_member_admin(int, boolean) from anon;
revoke execute on function public.admin_set_member_certificate_status(int, text) from anon;
