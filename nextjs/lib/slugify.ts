/**
 * URL slug from a title (Thai-aware) — lowercase, keep [a-z0-9ก-๙], spaces → hyphens,
 * collapse/strip repeats and edge hyphens. Shared by member blog authoring (C4c);
 * mirrors the admin blog action's rule but also trims leading/trailing hyphens.
 */
export function slugify(input: string): string {
  return input
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9ก-๙\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '');
}
