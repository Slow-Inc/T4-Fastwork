-- C4b: admin approves member-authored certificates. Admin identity = email in the
-- app_admins allowlist (seeded from ADMIN_EMAILS via seed-app-admins.ts). is_app_admin()
-- is SECURITY DEFINER so it can read app_admins (which has no direct grants — members
-- can't see/edit it). The status change runs through a SECURITY DEFINER RPC so it
-- bypasses the member column-grant (which withholds `status`) WITHOUT granting members
-- that column.

create table if not exists public.app_admins (
  email text primary key
);
alter table public.app_admins enable row level security;

create or replace function public.is_app_admin() returns boolean
language sql stable security definer set search_path = public as $$
  select exists(
    select 1 from public.app_admins
    where lower(email) = lower(coalesce(auth.jwt() ->> 'email', ''))
  );
$$;
revoke all on function public.is_app_admin() from public;
grant execute on function public.is_app_admin() to authenticated;

-- Admin can read ALL member certificates (incl. drafts) for the approval queue.
create policy "admin reads all member certs" on public.member_certificates
  for select to authenticated
  using (public.is_app_admin());

-- Privileged approve/unpublish. Gated to admins; members calling it fail the check.
create or replace function public.admin_set_member_certificate_status(p_id int, p_status text)
returns void language plpgsql security definer set search_path = public as $$
begin
  if not public.is_app_admin() then
    raise exception 'not authorized';
  end if;
  if p_status not in ('draft', 'published') then
    raise exception 'invalid status %', p_status;
  end if;
  update public.member_certificates set status = p_status where id = p_id;
end $$;
revoke all on function public.admin_set_member_certificate_status(int, text) from public;
grant execute on function public.admin_set_member_certificate_status(int, text) to authenticated;
