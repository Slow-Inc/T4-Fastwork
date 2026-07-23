/**
 * Slug for auto-created taxonomy rows (categories / tags / technologies).
 * Keep stable and URL-safe; empty → 'item'.
 */
export function taxonomySlug(name: string): string {
  const s = name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return s.length > 0 ? s.slice(0, 160) : 'item';
}
