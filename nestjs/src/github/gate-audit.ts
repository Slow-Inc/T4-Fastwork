/**
 * Detect merged PRs that landed without pre-merge gate evidence (#253). Pure — `gh` calls live in
 * `scripts/gate-audit.ts`, mirroring how `vercel-webhook-setup.ts` splits decision from I/O.
 *
 * Why this is a *detector* and not a preventer: `CLAUDE.md`'s enforcement table records that every
 * control in this repo is discipline only. A skipped gate therefore cannot be blocked here — but it can
 * be made to leave a trace, which is the one thing that was missing when the same skip repeated four
 * times on 2026-07-26 with nothing failing.
 *
 * The evidence a gate produces is a PR comment that quotes the **reviewed HEAD SHA** and names both
 * gates. Matching on the SHA is what makes this more than a keyword check: a review of an earlier HEAD
 * is stale by the gate's own rule, and stale evidence should read as *not reviewed*, not as reviewed.
 */

/** The gates `CLAUDE.md`'s STOP section requires on every branch, regardless of content. */
const REQUIRED_GATES = ['code-review', 'scrutinize'] as const;

export interface MergedPr {
  number: number;
  /** The commit SHA that was actually merged — what the evidence has to be about. */
  mergedHeadSha: string;
  /** Comment bodies on the PR, in any order. */
  comments: string[];
}

export type GateGap =
  | { number: number; reason: 'no-evidence' }
  /** Names a gate but quotes no full SHA — we cannot tell which commit was reviewed. */
  | { number: number; reason: 'unidentified-evidence' }
  /** Quotes a full SHA, but not the one that merged: stale by the gate's own re-run rule. */
  | { number: number; reason: 'stale-evidence'; reviewedSha: string }
  | { number: number; reason: 'incomplete-evidence'; missing: string[] };

/** Full 40-char SHAs quoted anywhere in a comment. Short SHAs are deliberately not accepted: the gate
 * asks for the reviewed HEAD, and an abbreviation cannot be matched against the merged head without
 * guessing how many characters the author felt like typing. */
function quotedShas(body: string): string[] {
  // Cast rather than rely on inference: with the `g` flag `match` yields the matched substrings, but
  // this project's type-aware lint resolves it as `any` and rejects the mapped return.
  const found = body.match(/\b[0-9a-f]{40}\b/g) as string[] | null;
  return (found ?? []).map((s) => s.toLowerCase());
}

function namesGates(body: string): string[] {
  const lower = body.toLowerCase();
  return REQUIRED_GATES.filter((g) => lower.includes(g));
}

/**
 * The PRs among `prs` that cannot show gate evidence for the commit they merged, each with the reason.
 * A PR is only reported once, by its most specific failure.
 */
export function findUnreviewedMerges(prs: MergedPr[]): GateGap[] {
  const gaps: GateGap[] = [];
  for (const pr of prs) {
    const head = pr.mergedHeadSha.toLowerCase();
    const candidates = pr.comments.filter((c) => namesGates(c).length > 0);
    if (candidates.length === 0) {
      gaps.push({ number: pr.number, reason: 'no-evidence' });
      continue;
    }
    const onHead = candidates.filter((c) => quotedShas(c).includes(head));
    if (onHead.length === 0) {
      const quoted = candidates.flatMap(quotedShas);
      if (quoted.length === 0) {
        // Names a gate, identifies no commit. Not stale — unverifiable, which is a different fix.
        gaps.push({ number: pr.number, reason: 'unidentified-evidence' });
      } else {
        gaps.push({
          number: pr.number,
          reason: 'stale-evidence',
          reviewedSha: quoted[0],
        });
      }
      continue;
    }
    const named = new Set(onHead.flatMap(namesGates));
    const missing = REQUIRED_GATES.filter((g) => !named.has(g));
    if (missing.length > 0) {
      gaps.push({ number: pr.number, reason: 'incomplete-evidence', missing });
    }
  }
  return gaps;
}
