/**
 * Compact Thai relative time for the sidebar's conversation rows (Open WebUI shows
 * a faint `3h / 4d / 1w` beside each chat). Pure: caller passes `now` so it stays
 * deterministic and testable. Buckets coarsen with age; a future timestamp (clock
 * skew) reads as "just now" rather than a negative value.
 */
const SEC = 1000;
const MIN = 60 * SEC;
const HOUR = 60 * MIN;
const DAY = 24 * HOUR;
const WEEK = 7 * DAY;
const MONTH = 30 * DAY;
const YEAR = 365 * DAY;

export function formatRelativeTime(ts: number, now: number): string {
  const diff = now - ts;
  if (diff < MIN) return "เมื่อครู่";
  if (diff < HOUR) return `${Math.floor(diff / MIN)} นาที`;
  if (diff < DAY) return `${Math.floor(diff / HOUR)} ชม.`;
  if (diff < WEEK) return `${Math.floor(diff / DAY)} วัน`;
  if (diff < MONTH) return `${Math.floor(diff / WEEK)} สัปดาห์`;
  if (diff < YEAR) return `${Math.floor(diff / MONTH)} เดือน`;
  return `${Math.floor(diff / YEAR)} ปี`;
}
