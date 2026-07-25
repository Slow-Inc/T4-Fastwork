-- Record whether the showcase sync reached a project, and why it failed (#193 / #185 S8).
-- Additive + nullable + idempotent. DO NOT apply to prod without explicit authorization.
--
-- `last_synced_at` is the last run that reached this project; `last_sync_error` is that run's error
-- for it, or null on success. Both are null for a project no run has touched yet, which
-- `isSyncUnhealthy` reports as `never` rather than treating as "age unknown".
-- ⚠️ EXPOSURE, decide before applying: no migration grants `public.projects` column-by-column, so
-- anon holds table-level SELECT and these two columns become world-readable through PostgREST the
-- moment they exist — `last_sync_error` carries upstream error text. A column-level
-- `revoke select (col)` does NOT help while table-level SELECT stands (Postgres treats the table
-- grant as covering every column, present and future); restricting it means revoking table SELECT
-- and re-granting an explicit column list, which risks breaking every public read if one is missed.
-- Mitigated at the source instead: the recorded message is capped (see `summarizeSyncFailures`) and
-- the full text stays in logs. Same posture as 0032's `last_capture_dispatch_at` / `gh_private`.
alter table projects
  add column if not exists last_synced_at timestamptz;

alter table projects
  add column if not exists last_sync_error text;
