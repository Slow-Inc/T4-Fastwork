-- Wave 1 T1.4: restore the public certificate feature flag.
alter table public.certificates
  add column if not exists is_featured boolean not null default false;
