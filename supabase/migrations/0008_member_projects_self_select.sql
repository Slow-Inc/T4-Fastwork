-- C3: a member chooses which of their repos to show (member_projects.selected).
-- Own-row scoped through the FK (these tables have member_id, not auth_user_id).
-- The public read policy (0007, selected=true) still applies to anon; this adds an
-- OR-ed policy so the member sees ALL their own rows (incl. unselected) to toggle.

create policy "member reads own projects" on public.member_projects
  for select to authenticated
  using (member_id in (select id from public.members where auth_user_id = auth.uid()));

create policy "member selects own projects" on public.member_projects
  for update to authenticated
  using (member_id in (select id from public.members where auth_user_id = auth.uid()))
  with check (member_id in (select id from public.members where auth_user_id = auth.uid()));

-- Supabase auto-grants table-wide UPDATE to authenticated; revoke then column-scope
-- so a member can only flip visibility/order, never rewrite name/url/description/rank.
revoke update on public.member_projects from authenticated;
grant update (selected, sort_order) on public.member_projects to authenticated;
