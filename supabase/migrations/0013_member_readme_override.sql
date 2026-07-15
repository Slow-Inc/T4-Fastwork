-- C3: a member can provide custom README markdown that replaces the live GitHub README
-- on their public profile. Own-row edit (the existing members "edit own row" policy +
-- column grant). Readable by the public read.
alter table public.members add column if not exists readme_override text;
grant select (readme_override) on public.members to anon, authenticated;
grant update (readme_override) on public.members to authenticated;
