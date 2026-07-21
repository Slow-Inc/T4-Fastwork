-- Flatten authorization — every linked TEAM MEMBER is a full admin.
-- Dev decision 2026-07-22: "ทุกคนได้สิทธิ์เต็มเป็น admin · ไม่ต้องแยก member/admin ·
-- ไม่ต้องมีการขออนุมัติ" (everyone = admin, no member/admin split, no approvals) —
-- rationale: a single admin being compromised is no less total than many, and a
-- single admin is a recovery single-point-of-failure (others can't revert a
-- defacement without admin) → everyone-admin is more resilient for a small
-- trusted team. Accepted with /security-review of the RLS.
--
-- THE CHANGE: drop the `and is_admin` gate from is_app_admin(). Every member whose
-- auth_user_id is linked then passes every EXISTING admin RLS policy + admin RPC.
-- The public content tables (projects/services/faqs/certificates/taxonomy — 0016,
-- write policy = is_app_admin(), grants already full to authenticated) and the
-- admin RPCs (admin_set_member_certificate_status / admin_set_member_admin — 0010/
-- 0011) therefore open to ALL team members with NO further change.
--
-- ALLOWLIST GUARDRAIL — unchanged, load-bearing: a non-team GitHub user can never
-- obtain a members row / auth_user_id link. link_current_member() (0005) only
-- claims a PRE-SEEDED members row whose github_login matches the caller's
-- unspoofable auth.identities login, "only if unlinked", never creating a row.
-- So "every member = admin" == the seeded team only, never the public.
--
-- OUT OF SCOPE HERE (follow-up migration, tracked): the member-owned tables
-- (member_projects / member_certificates / blog_posts / members) still carry
-- column-scoped grants + own-row policies. A follow-up relaxes their CONTENT
-- column grants + adds team-wide write policies so members publish directly and
-- edit each other's rows — while keeping IDENTITY columns (auth_user_id,
-- github_user_id, is_admin) protected from cross-member tampering. Done as a
-- separate, individually /security-reviewed step (per-column, not a blanket grant).

create or replace function public.is_app_admin() returns boolean
language sql stable security definer set search_path = public as $$
  -- Any LINKED team member (allowlist enforced by link_current_member, 0005).
  -- The `and is_admin` gate is intentionally removed — the team is flat.
  select exists(
           select 1 from public.members
           where auth_user_id = auth.uid()
         )
      -- email/password break-glass fallback (ADMIN_EMAILS) — unchanged
      or exists(
           select 1 from public.app_admins
           where lower(email) = lower(coalesce(auth.jwt() ->> 'email', ''))
         );
$$;

-- ---------------------------------------------------------------------------
-- VERIFY on a Supabase BRANCH / staging (NEVER prod), via JWT simulation:
--
--   -- a linked team member ⇒ admin
--   select set_config('request.jwt.claims',
--     json_build_object('sub', (select auth_user_id::text from public.members
--                                where auth_user_id is not null limit 1),
--                       'role','authenticated')::text, true);
--   select public.is_app_admin();                         -- expect: true
--
--   -- an arbitrary signed-in GitHub user with NO members row ⇒ NOT admin
--   select set_config('request.jwt.claims',
--     '{"sub":"00000000-0000-0000-0000-000000000000","role":"authenticated"}', true);
--   select public.is_app_admin();                         -- expect: false
--
--   -- and that member can now write public content (0016 policy):
--   --   set the member JWT, then UPDATE public.projects SET status='published' … ⇒ succeeds
--   --   set the no-member JWT, then the same UPDATE ⇒ "new row violates row-level security policy"
-- ---------------------------------------------------------------------------
