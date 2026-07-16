-- Security hardening (Phase 1): conversations, messages, document_embeddings were the
-- remaining public tables without RLS + with over-broad role grants, so they were reachable
-- through the public PostgREST API rather than backend-only. Deferred in ADR 0007
-- (§Consequences) for a separate pass — this is that pass. Brings them in line with the
-- content tables already locked down in migrations 0016/0017.
--
-- Fix (defense-in-depth, per ADR 0007's revoke-then-grant pitfall — grants gate ops/columns,
-- RLS gates rows; both are needed):
--   1) revoke the excessive anon + authenticated grants on all three tables,
--   2) enable RLS on all three (default-deny with no permissive policy),
--   3) conversations + messages: grant SELECT back to authenticated + an is_app_admin() read
--      policy, so the /admin dashboard (cookie client, role authenticated) keeps reading them;
--      anon and non-admin authenticated get nothing. This also closes the
--      conversations.session_id anon exposure (only admins can now read the row at all).
--   4) document_embeddings: no grant, no policy — backend-pooler-only (RAG ingest/retrieval).
--
-- The chat write path (conversation logging) and RAG ingest/retrieval run through the backend
-- Supavisor superuser pooler, which bypasses RLS — so they are unaffected. The public chat UI
-- stores history in the browser (localStorage), never via a Supabase client, so revoking anon
-- grants breaks nothing on the public site.

revoke all on public.conversations from anon, authenticated;
revoke all on public.messages from anon, authenticated;
revoke all on public.document_embeddings from anon, authenticated;

alter table public.conversations enable row level security;
alter table public.messages enable row level security;
alter table public.document_embeddings enable row level security;

-- admin dashboard reads (via the authenticated cookie client) — rows filtered to admins only.
grant select on public.conversations to authenticated;
grant select on public.messages to authenticated;

create policy "admin read conversations" on public.conversations
  for select to authenticated using (public.is_app_admin());
create policy "admin read messages" on public.messages
  for select to authenticated using (public.is_app_admin());
