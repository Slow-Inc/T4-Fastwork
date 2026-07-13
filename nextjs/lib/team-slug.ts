/** URL-safe slug for a team member's handle (used for `/team/[slug]` routes). */
export function teamSlug(handle: string): string {
  return handle
    .toLowerCase()
    .replace(/^_+/, '') // leading underscores (e.g. "_InI4")
    .replace(/[^a-z0-9-]/g, ''); // drop apostrophes, dots, etc.
}
