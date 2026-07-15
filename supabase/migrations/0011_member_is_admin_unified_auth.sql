-- Unify admin auth with member auth: a member flagged is_admin (logged in via GitHub)
-- gets admin access. Email/password + ADMIN_EMAILS stays as a break-glass fallback.

alter table public.members add column if not exists is_admin boolean not null default false;
-- Readable (not sensitive) — the admin guard checks it via the cookie/authenticated role.
grant select (is_admin) on public.members to anon, authenticated;

-- is_app_admin now recognises BOTH paths: a flagged member (GitHub) OR an app_admins
-- email (the email/password fallback). Used by the approve RPC + the admin guard's DB side.
create or replace function public.is_app_admin() returns boolean
language sql stable security definer set search_path = public as $$
  select exists(
           select 1 from public.members
           where auth_user_id = auth.uid() and is_admin
         )
      or exists(
           select 1 from public.app_admins
           where lower(email) = lower(coalesce(auth.jwt() ->> 'email', ''))
         );
$$;

-- An admin grants/revokes another member's admin flag (SECURITY DEFINER bypasses the
-- member column-grant on members; gated to admins).
create or replace function public.admin_set_member_admin(p_id int, p_is_admin boolean)
returns void language plpgsql security definer set search_path = public as $$
begin
  if not public.is_app_admin() then
    raise exception 'not authorized';
  end if;
  update public.members set is_admin = p_is_admin where id = p_id;
end $$;
revoke all on function public.admin_set_member_admin(int, boolean) from public;
grant execute on function public.admin_set_member_admin(int, boolean) to authenticated;

-- Bootstrap the first admin: xenodev (already GitHub-linked via C2).
update public.members set is_admin = true where slug = 'xenodev';
