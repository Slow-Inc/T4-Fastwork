/**
 * Pure select helpers for projects repo (#130 / #131).
 * Kept free of `server-only` so unit tests can import them.
 */

const PROJECT_COLS =
  'slug,title,title_en,description,content,live_url,snapshot_image,is_featured,published_at,' +
  'ai_rank,' +
  'gh_owner,gh_repo,owner_type,owner_login,';

const OVERVIEW_COLS =
  'overview_summary,overview_highlights,overview_good_for,' +
  'overview_summary_en,overview_highlights_en,overview_good_for_en,';

const JOINS_CORE =
  'category:categories(name),' +
  'project_technologies(technologies(name)),' +
  'project_tags(tags(name))';

const JOINS_WITH_USED_FOR =
  'category:categories(name),' +
  'project_technologies(technologies(name,used_for,used_for_en)),' +
  'project_tags(tags(name))';

/** Pre-migration: no overview, no used_for. */
export const SELECT_CORE = PROJECT_COLS + JOINS_CORE;

/** D3 overview columns; tech names only. */
export const SELECT_WITH_OVERVIEW =
  PROJECT_COLS + OVERVIEW_COLS + JOINS_CORE;

/** D3 + D4: overview + per-tech used_for embed. */
export const SELECT_FULL =
  PROJECT_COLS + OVERVIEW_COLS + JOINS_WITH_USED_FOR;

/** Overview without used_for (0030 not yet applied). */
export const SELECT_OVERVIEW_NO_USED_FOR = SELECT_WITH_OVERVIEW;

/** used_for without overview (0029 missing, 0030 present — uncommon). */
export const SELECT_USED_FOR_NO_OVERVIEW = PROJECT_COLS + JOINS_WITH_USED_FOR;

/** Ordered attempts: richest → poorest. Retry on unknown-column errors. */
export const PROJECT_SELECT_ATTEMPTS = [
  SELECT_FULL,
  SELECT_WITH_OVERVIEW,
  SELECT_USED_FOR_NO_OVERVIEW,
  SELECT_CORE,
] as const;

/** True when PostgREST does not know D3/D4 columns yet (pre-migration). */
export function isMissingProjectColumnError(error: {
  code?: string;
  message?: string;
} | null): boolean {
  if (!error) return false;
  if (error.code === 'PGRST204' || error.code === '42703') return true;
  const msg = error.message ?? '';
  return /overview_/i.test(msg) || /used_for/i.test(msg);
}

/** @deprecated use isMissingProjectColumnError */
export const isMissingOverviewColumnError = isMissingProjectColumnError;
