-- P2 (#81 · ADR 0009 D2): the map-reduce extract cache.
-- Cache each file's Stage1 map extract on its project_documents row, so an
-- unchanged file (same blob_sha) is never re-mapped by the LLM on regeneration.
-- Additive + nullable; a null `extract` simply means "not yet mapped / re-map it".
alter table public.project_documents
  add column if not exists extract jsonb;
