-- Wave 2 T2.1: bilingual blog posts. `audience`/`kind` already exist (0020); add the
-- English variants so DB-authored posts (and AI case studies) can carry EN copy.
-- Additive + idempotent. NOT YET APPLIED to prod (needs explicit authz per CLAUDE.md's
-- prod-DB rule).
--
-- ⚠️ COUPLING: the matching `blog-repo` change (add title_en/excerpt_en/content_en to the
-- SELECT + DbPostRow + mapDbPost) is DEFERRED and must ship in the SAME deploy as this
-- migration's apply — because a `select ...,title_en,...` against a DB where the column does
-- not yet exist ERRORS the whole query, which would drop /blog to its static fallback
-- (a regression). Until then blog-repo's SELECT stays EN-free and reads the DB fine.
alter table public.blog_posts
  add column if not exists title_en text,
  add column if not exists excerpt_en text,
  add column if not exists content_en text;

-- Keep member-authored bilingual writes reachable (extends the 0015 column-scoped grants).
grant insert (title_en, excerpt_en, content_en),
      update (title_en, excerpt_en, content_en)
  on public.blog_posts to authenticated;
