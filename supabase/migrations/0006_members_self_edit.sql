-- Member self-edit (Epic C / C3). A logged-in member may edit ONLY their own row,
-- and only the editable columns. Applied to prod via MCP.
--
-- Security shape:
--  * RLS UPDATE policy scopes writes to auth_user_id = auth.uid() (own row only).
--  * A COLUMN-scoped UPDATE grant limits what they can change to skills / stack /
--    readme_visible — never handle, slug, role, ids, auth_user_id, or the *_owner
--    provenance columns.
--  * A trigger flips skills_owner / stack_owner to 'human' when those change (D1),
--    so a future GitHub sync never overwrites a member's own edit — and the member
--    can't revert the flag (they have no grant on the owner columns).

create policy "members edit own row" on public.members
  for update to authenticated
  using (auth_user_id = auth.uid())
  with check (auth_user_id = auth.uid());

-- Supabase grants a table-level UPDATE to `authenticated` by default, which would
-- let a member edit ANY column of their own row (role, handle, slug, provenance
-- owners). Drop it so the column-scoped grant below is the effective allowlist.
revoke update on public.members from authenticated;
grant update (skills, stack, readme_visible) on public.members to authenticated;

create or replace function public.members_flag_human_edits()
returns trigger
language plpgsql
as $$
begin
  if new.skills is distinct from old.skills then
    new.skills_owner := 'human';
  end if;
  if new.stack is distinct from old.stack then
    new.stack_owner := 'human';
  end if;
  return new;
end;
$$;

drop trigger if exists members_human_edits on public.members;
create trigger members_human_edits
  before update on public.members
  for each row execute function public.members_flag_human_edits();
