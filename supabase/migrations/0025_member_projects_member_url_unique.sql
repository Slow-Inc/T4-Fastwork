-- B4: enable an idempotent reconcile of member_projects from live GitHub snapshots.
-- Each team member's PUBLIC repos (all of them — forks/archived included; the admin
-- curates which show) are synced into member_projects by the backend (superuser pooler,
-- bypasses RLS). Re-running the sync must UPDATE an existing repo row's content (name/
-- description/tech/year) WITHOUT clobbering the human-curated `selected` / `sort_order`.
-- That upsert needs a unique key; a repo's html_url is its stable public identity.
--
-- New synced rows default `selected = false` (the app inserts it explicitly) so nothing
-- shows until an admin picks it in admin/members/[id]/edit — matching the product intent
-- ("pull everything, choose in admin"). The column default stays `true` for manually
-- seeded/authored rows; only the sync opts new repos out.
--
-- PROD-APPLY PREFLIGHT: `select member_id, url, count(*) from public.member_projects
-- group by 1,2 having count(*) > 1;` must return no rows (dedupe first if the static seed
-- left any duplicate url per member).
alter table public.member_projects
  add constraint member_projects_member_url_unique unique (member_id, url);
