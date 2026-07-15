-- Public read grant for the `members` table (Epic C / C1). The table itself is
-- created by the Drizzle migration (nestjs/drizzle/0004). This grants the anon /
-- authenticated roles SELECT so the public site (tech carousel, /team) can read
-- profiles — matching the other RLS-disabled public tables. RLS hardening for
-- member-writable access lands with C2 (the auth boundary). Idempotent.
grant select on public.members to anon, authenticated;
