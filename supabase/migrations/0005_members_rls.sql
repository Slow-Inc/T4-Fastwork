-- Member auth boundary (Epic C / C2). Enables RLS on `members` and adds the
-- secure first-login link. Idempotent-ish (drop-if-exists before create).
--
-- Model:
--  * Profiles are public → anyone may SELECT.
--  * Linking a Supabase auth user to their member row is done ONLY by the
--    SECURITY DEFINER function `link_current_member()`, which sets
--    auth_user_id = auth.uid() for the member whose github_login matches the
--    caller's JWT github login (user_metadata.user_name), and only if unlinked.
--    A caller can therefore only ever claim THEIR OWN member row, never another.
--  * Members are NOT granted a blanket UPDATE here — self-edit (column-scoped)
--    lands with C3. So today a logged-in member can read + claim their row; they
--    cannot mutate arbitrary columns via the API.

alter table public.members enable row level security;

drop policy if exists "members public read" on public.members;
create policy "members public read" on public.members
  for select to anon, authenticated using (true);

-- SECURITY DEFINER: runs as the function owner so it can set auth_user_id, but its
-- body restricts the write to the caller's own unlinked row. The GitHub login is
-- read from auth.identities.identity_data (GoTrue-populated, NOT user-editable) —
-- NOT from user_metadata, which a user can spoof via auth.updateUser() to claim
-- another member's row.
create or replace function public.link_current_member()
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_login text;
  v_slug text;
begin
  select lower(i.identity_data ->> 'user_name')
    into v_login
    from auth.identities i
   where i.user_id = auth.uid()
     and i.provider = 'github'
   limit 1;
  if v_login is null or v_login = '' then
    return null;
  end if;
  update members
     set auth_user_id = auth.uid()
   where github_login = v_login
     and auth_user_id is null
  returning slug into v_slug;

  if v_slug is null then
    -- Already linked to this user? return that slug so re-login is idempotent.
    select slug into v_slug
      from members
     where github_login = v_login
       and auth_user_id = auth.uid();
  end if;
  return v_slug;
end;
$$;

revoke all on function public.link_current_member() from public, anon;
grant execute on function public.link_current_member() to authenticated;

-- Defense-in-depth: keep the internal link/id columns out of the public (anon)
-- read surface. A column-level revoke is ineffective while a table-level SELECT
-- grant exists (0004), so drop that and re-grant only the public profile columns.
-- `authenticated` keeps full SELECT (getCurrentMember filters on auth_user_id).
revoke select on public.members from anon;
grant select (
  handle, slug, github_login, github_url, role, role_en,
  skills, stack, education, readme_visible, sort_order
) on public.members to anon;
