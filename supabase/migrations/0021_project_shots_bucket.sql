-- 0021: create the `project-shots` Storage bucket for the screenshot worker.
--
-- The worker (nextjs/scripts/screenshot-projects.ts, spec P4) uploads each published
-- project's cover screenshot here, and the public site loads it via getPublicUrl — so
-- the bucket must be PUBLIC (read). Uploads run under the Supabase secret key, which
-- bypasses storage RLS, so no write policy is needed (and none is added: anon/
-- authenticated must not be able to write to it).
--
-- Committed as a migration (not a one-off dashboard click) so a rebuilt or branch DB
-- reproduces it — same anti-drift posture as migration 0019 (github_snapshots RLS).
insert into storage.buckets (id, name, public)
values ('project-shots', 'project-shots', true)
on conflict (id) do nothing;
