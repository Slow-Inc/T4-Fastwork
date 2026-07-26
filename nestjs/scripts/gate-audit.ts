/**
 * Report merged PRs that landed without pre-merge gate evidence (#253). Thin I/O wrapper — the
 * decision logic is in `src/github/gate-audit.ts` and is unit-tested.
 *
 *   bun run scripts/gate-audit.ts             # the default window (30 most recent merged PRs)
 *   bun run scripts/gate-audit.ts --limit 60
 *   bun run scripts/gate-audit.ts --since 2026-07-26
 *
 * Run this at session start. A non-empty report is a process incident: record it before starting new
 * delivery, and do **not** back-fill evidence onto the offending PR — evidence produced after the merge
 * is documentation, not a gate, and back-filling makes the record lie about what happened.
 *
 * Requires `gh` on PATH and read access to the repo. Reads only; it never comments or merges.
 */
import { findUnreviewedMerges, type MergedPr } from '../src/github/gate-audit';

interface GhPr {
  number: number;
  mergedAt: string | null;
  headRefOid: string;
  comments?: { body: string }[];
}

function arg(name: string): string | undefined {
  const i = process.argv.indexOf(`--${name}`);
  return i === -1 ? undefined : process.argv[i + 1];
}

async function gh(args: string[]): Promise<string> {
  const proc = Bun.spawn(['gh', ...args], { stdout: 'pipe', stderr: 'pipe' });
  const [out, err, code] = await Promise.all([
    new Response(proc.stdout).text(),
    new Response(proc.stderr).text(),
    proc.exited,
  ]);
  if (code !== 0) throw new Error(`gh ${args[0]} failed: ${err.trim()}`);
  return out;
}

async function main(): Promise<void> {
  const limit = arg('limit') ?? '30';
  const since = arg('since');

  const listed = JSON.parse(
    await gh([
      'pr',
      'list',
      '--state',
      'merged',
      '--limit',
      limit,
      '--json',
      'number,mergedAt,headRefOid,comments',
    ]),
  ) as GhPr[];

  const inWindow = listed.filter(
    (p) => p.mergedAt && (!since || p.mergedAt.slice(0, 10) >= since),
  );

  const prs: MergedPr[] = inWindow.map((p) => ({
    number: p.number,
    mergedHeadSha: p.headRefOid,
    comments: (p.comments ?? []).map((c) => c.body),
  }));

  const gaps = findUnreviewedMerges(prs);

  console.log(`audited ${prs.length} merged PRs${since ? ` since ${since}` : ''}`);
  if (gaps.length === 0) {
    // Say the window out loud: "0 gaps" over an empty window is not a clean bill of health, and that
    // is exactly the kind of vacuous pass this audit exists to stop being fooled by.
    console.log(prs.length === 0 ? 'no PRs in window — nothing was checked' : 'all had evidence');
    return;
  }
  console.log(`\n${gaps.length} merged without usable gate evidence:`);
  for (const g of gaps) {
    const detail =
      g.reason === 'stale-evidence'
        ? ` — reviewed ${g.reviewedSha.slice(0, 7)}, which is not the merged head`
        : g.reason === 'incomplete-evidence'
          ? ` — missing: ${g.missing.join(', ')}`
          : g.reason === 'unidentified-evidence'
            ? ' — names a gate but quotes no full SHA, so what was reviewed is unverifiable'
            : '';
    console.log(`  #${g.number}  ${g.reason}${detail}`);
  }
  console.log(
    '\nThis is a process incident, not a chore. Record it; do not back-fill evidence onto the PR.',
  );
}

await main();
