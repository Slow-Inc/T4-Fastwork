-- Record whether the showcase sync reached a project, and why it failed (#193 / #185 S8).
-- Additive + nullable + idempotent. DO NOT apply to prod without explicit authorization.
--
-- `last_synced_at` is the last run that reached this project; `last_sync_error` is that run's error
-- for it, or null on success. Both are null for a project no run has touched yet, which
-- `isSyncUnhealthy` reports as `never` rather than treating as "age unknown".
alter table projects
  add column if not exists last_synced_at timestamptz;

alter table projects
  add column if not exists last_sync_error text;
