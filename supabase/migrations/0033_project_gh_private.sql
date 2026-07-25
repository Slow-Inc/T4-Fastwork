-- Persist GitHub repo visibility for showcase rows (#194).
-- Additive + nullable. DO NOT apply to prod without explicit authorization.
alter table projects
  add column if not exists gh_private boolean;
