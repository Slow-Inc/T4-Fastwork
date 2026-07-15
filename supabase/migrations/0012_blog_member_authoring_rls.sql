-- C4c: member blog authoring (additive, D4). Add author linkage + enable RLS so a
-- member can author their own DRAFT (published_at null); only an admin publishes.
-- Policies (not column grants) gate the publish bit: the member insert/update policies
-- require published_at is null, so a member can never self-publish, while the admin
-- (is_app_admin) policy may set it. anon reads published only (also fixes drafts leaking).

alter table public.blog_posts add column if not exists author_id integer references public.members(id);
alter table public.blog_posts enable row level security;

-- Public read: published posts only (anon + authenticated).
create policy "public read published posts" on public.blog_posts
  for select using (published_at is not null);

-- Admin: full access (approve = set published_at; edit/delete anything).
create policy "admin manage posts" on public.blog_posts
  for all to authenticated
  using (public.is_app_admin())
  with check (public.is_app_admin());

-- Member: read their own posts (incl. their drafts).
create policy "member reads own posts" on public.blog_posts
  for select to authenticated
  using (author_id in (select id from public.members where auth_user_id = auth.uid()));

-- Member: author their own DRAFT (published_at must be null → can't self-publish).
create policy "member adds own draft posts" on public.blog_posts
  for insert to authenticated
  with check (
    author_id in (select id from public.members where auth_user_id = auth.uid())
    and published_at is null
  );

-- Member: edit their own post while it stays a draft.
create policy "member edits own draft posts" on public.blog_posts
  for update to authenticated
  using (
    author_id in (select id from public.members where auth_user_id = auth.uid())
    and published_at is null
  )
  with check (
    author_id in (select id from public.members where auth_user_id = auth.uid())
    and published_at is null
  );

-- Member: delete their own draft.
create policy "member deletes own draft posts" on public.blog_posts
  for delete to authenticated
  using (
    author_id in (select id from public.members where auth_user_id = auth.uid())
    and published_at is null
  );
