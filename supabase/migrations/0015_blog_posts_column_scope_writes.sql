-- Security fix (scrutinize/pre-merge): blog_posts had table-wide INSERT/UPDATE grants to
-- `authenticated`, so a member could set system-managed fields (views, ai_rank,
-- ai_rank_rationale) on their own draft — persisting through admin approval to game the
-- blog ranking + fake view counts. Column-scope the writes to the content fields only
-- (mirrors the member_certificates approach). The AI rank job writes ai_rank via the
-- superuser pooler (bypasses column grants); nothing in the app writes views/ai_rank as
-- `authenticated`.
revoke insert, update on public.blog_posts from authenticated;
grant insert (author_id, author, slug, title, excerpt, content, tags, read_time_min, published_at)
  on public.blog_posts to authenticated;
grant update (author_id, author, slug, title, excerpt, content, tags, read_time_min, published_at)
  on public.blog_posts to authenticated;
