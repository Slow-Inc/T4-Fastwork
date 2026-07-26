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
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { findUnreviewedMerges, type MergedPr } from '../src/github/gate-audit';

const run = promisify(execFile);

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

/**
 * `node:child_process`, not `Bun.spawn`: `tsconfig.build.json` excludes only tests, so this file is
 * type-checked by the production Nest build, which has no Bun types and emits CommonJS. Using the Bun
 * global here failed the deploy (TS2867) — caught by the pre-merge gate on PR #254 before it landed.
 */
async function gh(args: string[]): Promise<string> {
  // A large PR list can exceed the default 1 MB stdout buffer.
  const { stdout } = await run('gh', args, { maxBuffer: 32 * 1024 * 1024 });
  return stdout;
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

// Not top-level `await`: the production build emits CommonJS and rejects it (TS1309). Mirrors
// `setup-vercel-webhook.ts`.
main().catch((err: unknown) => {
  console.error(err instanceof Error ? err.message : String(err));
  process.exit(1);
});
