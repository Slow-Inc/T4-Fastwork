-- Flatten authorization, part 2 — the MEMBER-OWNED tables.
-- Follow-up to 0023 (which flattened is_app_admin() so every linked team member is an
-- admin). 0023 alone already opened every table that carried a `for all ... is_app_admin()`
-- policy: the public content tables (0016), blog_posts ("admin manage posts", 0012), and
-- the project M2M joins (0017). This migration finishes the job for the three member-owned
-- tables whose write policies are still OWN-ROW scoped, so a member cannot yet edit a
-- TEAMMATE's row:
--   * members            (only "members edit own row")
--   * member_projects    (only "member selects own projects")
--   * member_certificates(only "member ... own certs" + an admin READ policy)
--
-- Dev decision 2026-07-22 (same as 0023): everyone = admin · no member/admin split · no
-- approvals · "คนอื่นสามารถแก้ไขของคนอื่นๆได้" (members may edit each other's content and
-- publish directly).
--
-- ── THE SECURITY MODEL: grants gate COLUMNS, policies gate ROWS ──────────────
-- The existing column-scoped grants are the load-bearing allowlist and are LEFT INTACT.
-- They already withhold every identity / provenance column from `authenticated`:
--   members:            granted = skills, stack, readme_visible, readme_override
--                       WITHHELD = auth_user_id, github_user_id, is_admin, slug, handle,
--                                  role, skills_owner, stack_owner  (never granted)
--   member_projects:    granted = selected, sort_order   (content name/url/desc = backend)
--   member_certificates:granted = issuer, title, asset_*, sort_order (+ status added below)
-- So widening a ROW policy to is_app_admin() lets a member reach ANY row, but still only
-- the columns their grant allows — identity columns remain unwritable by any member,
-- protecting against cross-member privilege tampering (auth_user_id relink, is_admin flip,
-- slug/handle hijack). This is why the policies below are safe without touching grants,
-- except the one deliberate content grant (member_certificates.status, for direct publish).
--
-- IDENTITY vs CONTENT (reviewed 2026-07-22, codex adversarial pass): the protected identity/
-- privilege class is members.{auth_user_id, github_user_id, is_admin, slug, handle, role,
-- *_owner} — none are granted, so no policy can expose them. NOTE member_projects.member_id
-- and member_certificates.member_id are CONTENT-ROUTING (which profile a row displays on),
-- NOT identity — the member_certificates INSERT grant (0009) includes member_id, so a member
-- may create a cert ON A TEAMMATE'S profile. That is the SANCTIONED flat behavior ("team edits
-- everyone's content"), not a hole: member_id confers no auth and cannot escalate. Intra-team
-- mischief is accepted by the flat-trust decision itself. (UPDATE cannot reassign member_id —
-- it is not in the update grant — so existing rows keep their owner.)
--
-- BREAK-GLASS EXCEPTION (intended): is_app_admin()'s second branch matches app_admins email
-- (ADMIN_EMAILS). Such an operator admin may have NO members row yet still write member content
-- here — this is the deliberate email/password recovery path (operator-controlled allowlist,
-- no self-service grant), consistent with every other is_app_admin() table (0016/0012/0017).
-- It is NOT the "signed-in non-member" threat (that's an ordinary GitHub user with no row and
-- no allowlisted email, who gets nothing: to authenticated + no matching branch).
--
-- ── DELIBERATELY OUT OF SCOPE (the allowlist boundary) ───────────────────────
-- No INSERT/DELETE grant or policy is added for public.members. Creating or deleting a
-- members row = mutating the admin allowlist itself, and the allowlist (link_current_member,
-- 0005 — claims a PRE-SEEDED row by unspoofable github_login) is exactly what makes
-- "every member = admin" == the seeded team and NOT the public. Adding/removing a teammate
-- stays a deliberate backend/seed operation; that friction is a feature, not a gap.

-- ── members: team edits any member's PROFILE CONTENT (not identity) ──────────
-- UPDATE only (not "for all") — INSERT/DELETE stay backend-only per the boundary note above.
-- Column grant (skills/stack/readme_visible/readme_override) is the effective allowlist;
-- the members_flag_human_edits trigger still flips *_owner to 'human' on skills/stack edits.
create policy "team edits member profiles" on public.members
  for update to authenticated
  using (public.is_app_admin())
  with check (public.is_app_admin());

-- ── member_projects: any member curates any teammate's project visibility/order ──
-- for all + is_app_admin(); the grant limits writes to (selected, sort_order). No INSERT/
-- DELETE grant to authenticated (rows come from GitHub sync), so those ops stay blocked by
-- privilege even though the policy is permissive — same posture as the public tables.
create policy "team writes member projects" on public.member_projects
  for all to authenticated
  using (public.is_app_admin())
  with check (public.is_app_admin());

-- ── member_certificates: any member adds/edits/deletes/PUBLISHES any cert ─────
-- Direct publish (no approval): grant the status column so is_app_admin members can set
-- status='published'. The DELETE grant already exists (0009); insert/update content grants
-- already exist. The old own-row + draft-only policies remain as a permissive subset.
--
-- Harden FIRST: status had no CHECK — the approve RPC (0010) validated `in ('draft',
-- 'published')`, but the direct grant below has no such guard, so a member could write a
-- garbage status the public read (status='published') would silently hide. Constrain it
-- before opening the grant. The column is already NOT NULL + default 'published' (Drizzle
-- schema member-content.ts), so CHECK + NOT NULL yields a genuine two-state (no NULL third
-- state). PROD-APPLY PREFLIGHT: run `select distinct status from public.member_certificates`
-- first — certs are member-authored (not GitHub-synced), seeded='published', authored=
-- draft/published, so this should be clean; a stray value would abort the ADD CONSTRAINT.
alter table public.member_certificates
  add constraint member_certificates_status_check
  check (status in ('draft', 'published'));
grant update (status) on public.member_certificates to authenticated;
create policy "team writes member certificates" on public.member_certificates
  for all to authenticated
  using (public.is_app_admin())
  with check (public.is_app_admin());

-- NOTE (no change needed): admin_set_member_certificate_status / admin_set_member_admin
-- (0010/0011) still exist and now pass their is_app_admin() gate for every linked member.
-- admin_set_member_admin toggles members.is_admin, which is now VESTIGIAL — is_app_admin()
-- no longer reads it (0023). Harmless; the app-layer flatten removes the approvals/admin-
-- toggle UI that calls them. Left in place to avoid breaking callers before that lands.

-- ---------------------------------------------------------------------------
-- VERIFY on a Supabase BRANCH / staging (NEVER prod), via JWT simulation:
--
--   -- pick a real linked member and a second member id to prove CROSS-member write:
--   -- (run as the linked member)
--   select set_config('request.jwt.claims',
--     json_build_object('sub', (select auth_user_id::text from public.members
--                                where auth_user_id is not null limit 1),
--                       'role','authenticated')::text, true);
--   select public.is_app_admin();                                   -- expect: true
--
--   -- edit ANOTHER member's profile content ⇒ succeeds:
--   update public.members set skills = skills where id <> (
--     select id from public.members where auth_user_id = auth.uid());   -- expect: UPDATE n
--   -- attempt to write an IDENTITY column ⇒ blocked by missing grant:
--   update public.members set is_admin = true where id = 1;         -- expect: permission denied for column is_admin
--   update public.members set auth_user_id = auth.uid() where id = 1;-- expect: permission denied for column auth_user_id
--
--   -- publish a cert directly (no approval) ⇒ succeeds:
--   update public.member_certificates set status = 'published' where id = <any>; -- expect: UPDATE 1
--
--   -- a signed-in GitHub user with NO members row ⇒ everything read-only:
--   select set_config('request.jwt.claims',
--     '{"sub":"00000000-0000-0000-0000-000000000000","role":"authenticated"}', true);
--   select public.is_app_admin();                                   -- expect: false
--   update public.member_certificates set status='published' where id=<any>; -- expect: 0 rows (RLS)
--   insert into public.members (slug) values ('x');                 -- expect: permission denied / RLS
-- ---------------------------------------------------------------------------
