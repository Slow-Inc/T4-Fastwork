/**
 * Sync each team member's PUBLIC GitHub repos into `member_projects` (B4). Unlike
 * CurateService (which filters to eligible org/personal repos → draft `projects`), this
 * pulls EVERY public repo — forks and archived included — so the admin can choose which
 * to show per member in admin/members/[id]/edit. New rows land `selected = false`; the
 * upsert preserves the human-curated `selected` / `sort_order` on re-sync (see 0025).
 *
 * The mapping + orchestration are pure over injected ports (a snapshot reader + a member/
 * project store), so they unit-test without a DB; the Pg store is a thin adapter.
 */
import { snapshotKey } from './github.config';
import type { SnapshotReadPort } from './github-curate-run';

/** The raw GitHub REST repo fields this sync reads (snake_case, as cached verbatim). */
export interface RawRepo {
  name?: unknown;
  html_url?: unknown;
  description?: unknown;
  language?: unknown;
  pushed_at?: unknown;
}

/** A member_projects row synthesised from a repo (content only — not selected/sort_order). */
export interface MemberProjectRow {
  memberId: number;
  name: string;
  description: string;
  url: string;
  tech: string[];
  year: number;
}

/**
 * Map ONE raw GitHub repo to a member_projects row for `memberId`; null if malformed
 * (missing name/url) so a single bad cache entry never breaks a sync. No eligibility
 * filter — every public repo is included.
 */
export function repoToMemberProjectRow(
  raw: RawRepo | null | undefined,
  memberId: number,
): MemberProjectRow | null {
  if (!raw || typeof raw !== 'object') return null;
  if (typeof raw.name !== 'string' || typeof raw.html_url !== 'string')
    return null;
  const pushedAt = typeof raw.pushed_at === 'string' ? raw.pushed_at : '';
  return {
    memberId,
    name: raw.name,
    description: typeof raw.description === 'string' ? raw.description : '',
    url: raw.html_url,
    tech:
      typeof raw.language === 'string' && raw.language ? [raw.language] : [],
    year: Number(pushedAt.slice(0, 4)) || 0,
  };
}

export interface MemberWithLogin {
  id: number;
  login: string;
}

export interface MemberProjectStore {
  /** The linked/seeded members that have a GitHub login (the sync targets). */
  getMembersWithLogin(): Promise<MemberWithLogin[]>;
  /** Idempotent upsert (on member_id+url) — updates content, preserves selected/sort_order. */
  upsertMemberProjects(rows: MemberProjectRow[]): Promise<void>;
}

export interface ReconcileResult {
  perMember: { login: string; repos: number }[];
  total: number;
}

/**
 * For each member, read their cached public repo list and map to member_projects rows.
 * `apply=false` is a dry run (counts only, no write). Pure over the ports.
 */
export async function reconcileMemberProjects(
  members: MemberWithLogin[],
  reader: SnapshotReadPort,
  store: MemberProjectStore,
  apply: boolean,
): Promise<ReconcileResult> {
  const perMember: { login: string; repos: number }[] = [];
  const all: MemberProjectRow[] = [];
  for (const m of members) {
    const snap = await reader.read(snapshotKey.memberRepos(m.login));
    const raw =
      snap && Array.isArray(snap.data) ? (snap.data as RawRepo[]) : [];
    const rows = raw
      .map((r) => repoToMemberProjectRow(r, m.id))
      .filter((r): r is MemberProjectRow => r !== null);
    perMember.push({ login: m.login, repos: rows.length });
    all.push(...rows);
  }
  if (apply && all.length > 0) await store.upsertMemberProjects(all);
  return { perMember, total: all.length };
}
