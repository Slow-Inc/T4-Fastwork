-- Event-driven cover recapture idempotency (#190 / epic #185).
-- Additive + nullable. DO NOT apply to prod without explicit authorization.
alter table projects
  add column if not exists last_capture_trigger text;

alter table projects
  add column if not exists last_capture_dispatch_at timestamptz;
