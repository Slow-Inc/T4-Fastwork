/**
 * Cascading per-item entrance delay (capped so long lists don't drag out).
 * Shared by the reveal-on-scroll lists across the site (FAQ, team directory,
 * project lists, certificate grids) so they all animate with one rhythm.
 */
export function staggerDelay(index: number, stepMs = 60, cap = 8): string {
  return `${Math.min(index, cap) * stepMs}ms`;
}
