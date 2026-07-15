-- C4: a member authors their own certificates (additive, D4). New rows are forced to
-- status='draft' (the with_check) so they only appear publicly after an admin approves
-- (0007's public policy shows status='published' only). Own-row scoped through the FK.

create policy "member reads own certs" on public.member_certificates
  for select to authenticated
  using (member_id in (select id from public.members where auth_user_id = auth.uid()));

create policy "member adds own draft certs" on public.member_certificates
  for insert to authenticated
  with check (
    member_id in (select id from public.members where auth_user_id = auth.uid())
    and status = 'draft'
  );

create policy "member edits own certs" on public.member_certificates
  for update to authenticated
  using (member_id in (select id from public.members where auth_user_id = auth.uid()))
  with check (member_id in (select id from public.members where auth_user_id = auth.uid()));

create policy "member deletes own certs" on public.member_certificates
  for delete to authenticated
  using (member_id in (select id from public.members where auth_user_id = auth.uid()));

-- Column-scope the writes: member may set content + status-on-insert (with_check pins
-- it to 'draft'), but UPDATE excludes `status` so a member can never self-publish.
revoke insert, update on public.member_certificates from authenticated;
grant insert (member_id, issuer, title, asset_webp, asset_pdf, asset_img, status)
  on public.member_certificates to authenticated;
grant update (issuer, title, asset_webp, asset_pdf, asset_img, sort_order)
  on public.member_certificates to authenticated;
grant delete on public.member_certificates to authenticated;
