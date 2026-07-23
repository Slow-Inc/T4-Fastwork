/**
 * Pure select helpers for projects repo (#130).
 * Kept free of `server-only` so unit tests can import them.
 */

export const SELECT_CORE =
  'slug,title,title_en,description,content,live_url,snapshot_image,is_featured,published_at,' +
  'ai_rank,' +
  'gh_owner,gh_repo,owner_type,owner_login,' +
  'category:categories(name),' +
  'project_technologies(technologies(name)),' +
  'project_tags(tags(name))';

export const SELECT_WITH_OVERVIEW =
  'slug,title,title_en,description,content,live_url,snapshot_image,is_featured,published_at,' +
  'ai_rank,' +
  'gh_owner,gh_repo,owner_type,owner_login,' +
  'overview_summary,overview_highlights,overview_good_for,' +
  'overview_summary_en,overview_highlights_en,overview_good_for_en,' +
  'category:categories(name),' +
  'project_technologies(technologies(name)),' +
  'project_tags(tags(name))';

/** True when PostgREST does not know D3 overview columns yet (pre-migration). */
export function isMissingOverviewColumnError(error: {
  code?: string;
  message?: string;
} | null): boolean {
  if (!error) return false;
  if (error.code === 'PGRST204' || error.code === '42703') return true;
  return /overview_/i.test(error.message ?? '');
}
