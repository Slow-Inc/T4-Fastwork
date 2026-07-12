-- Certificate metadata fields (Requirement §6.8), additive/idempotent.
-- Apply against the Supabase project this repo talks to — not run automatically.
alter table public.certificates
  add column if not exists title_en text,
  add column if not exists issuer_logo text,
  add column if not exists thumbnail text,
  add column if not exists full_image text,
  add column if not exists verify_url text;
