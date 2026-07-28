/**
 * Report any server-side repository guard that is no longer on (#279). Thin I/O wrapper — the decision
 * logic is in `src/github/repo-guards.ts` and is unit-tested.
 *
 *   bun run scripts/check-repo-guards.ts
 *
 * This exists because `CLAUDE.md`'s enforcement table may only claim machinery it can show, and two of
 * its rows are GitHub **settings** with no file to point at. The table names this command; running it
 * is how a claim that has quietly decayed gets caught instead of ageing into fiction.
 *
 * Reads only — it never changes a setting. Requires `gh` on PATH with admin read on the repository.
 */
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import {
  deliberatelyUnenforced,
  findGuardGaps,
  type ProtectionResponse,
  type SecurityResponse,
} from '../src/github/repo-guards';

const run = promisify(execFile);

const REPO = 'Slow-Inc/T4-Fastwork';
const BRANCH = 'master';

async function gh(args: string[]): Promise<string> {
  const { stdout } = await run('gh', args, { maxBuffer: 8 * 1024 * 1024 });
  return stdout;
}

/**
 * Three outcomes, never two. "The guard is off" and "I could not look" are different facts, and
 * collapsing them is the defect this script exists to catch elsewhere — a first draft of it did
 * exactly that, reporting four healthy guards as missing because `gh` returned less than expected.
 */
type Read<T> = { ok: true; value: T | null } | { ok: false; why: string };

/** A 404 here means "not protected", which IS a gap. Anything else means the check did not happen. */
async function readProtection(): Promise<Read<ProtectionResponse>> {
  try {
    const out = await gh([
      'api',
      `repos/${REPO}/branches/${BRANCH}/protection`,
    ]);
    return { ok: true, value: JSON.parse(out) as ProtectionResponse };
  } catch (err) {
    const text = err instanceof Error ? err.message : String(err);
    if (/Branch not protected/i.test(text)) return { ok: true, value: null };
    return { ok: false, why: `could not read branch protection: ${text.slice(0, 200)}` };
  }
}

/**
 * `security_and_analysis` is only present for a request with admin rights. Its ABSENCE therefore means
 * the request was not privileged — not that scanning is off. Measured 2026-07-28: the same `gh` command
 * returns the block from an interactive shell and omits it when spawned through `execFile` here, so
 * treating a missing block as "disabled" would report false gaps on a correctly configured repository.
 */
async function readSecurity(): Promise<Read<SecurityResponse>> {
  try {
    const out = await gh(['api', `repos/${REPO}`]);
    const repo = JSON.parse(out) as {
      security_and_analysis?: SecurityResponse;
    };
    if (!repo.security_and_analysis) {
      return {
        ok: false,
        why:
          'the repository response carried no security_and_analysis block, which means this ' +
          'request was not privileged — not that the settings are off. Re-run where `gh` is ' +
          'authenticated with admin rights.',
      };
    }
    return { ok: true, value: repo.security_and_analysis };
  } catch (err) {
    const text = err instanceof Error ? err.message : String(err);
    return { ok: false, why: `could not read repository settings: ${text.slice(0, 200)}` };
  }
}

async function main(): Promise<void> {
  const [protection, security] = await Promise.all([
    readProtection(),
    readSecurity(),
  ]);

  // Refuse to render a verdict on a partial read. A checker that guesses is worse than one that says
  // it does not know, because the guess is what gets quoted.
  const unread = [protection, security].filter((r) => !r.ok);
  if (unread.length > 0) {
    console.log('cannot verify the guards — no verdict rendered:');
    for (const r of unread) if (!r.ok) console.log(`  ${r.why}`);
    process.exitCode = 2;
    return;
  }

  const prot = protection.ok ? protection.value : null;
  const sec = security.ok ? security.value : null;
  const gaps = findGuardGaps(prot, sec);

  for (const note of deliberatelyUnenforced(prot)) {
    console.log(`note: ${note}`);
  }

  if (gaps.length === 0) {
    console.log(
      `all recorded guards are on for ${REPO}@${BRANCH} — the enforcement table's claims hold.`,
    );
    return;
  }

  console.log(`\n${gaps.length} guard(s) no longer match what CLAUDE.md claims:`);
  for (const g of gaps) {
    console.log(`  ${g.guard}\n    expected: ${g.expected}\n    actual:   ${g.actual}`);
  }
  console.log(
    '\nEither restore the setting, or change the enforcement table to stop claiming it. A row that ' +
      'outlives its mechanism is the defect this table exists to prevent.',
  );
  process.exitCode = 1;
}

// Not top-level `await`: the production build emits CommonJS and rejects it (TS1309). Mirrors
// `gate-audit.ts` and `setup-vercel-webhook.ts`.
main().catch((err: unknown) => {
  console.error(err instanceof Error ? err.message : String(err));
  process.exitCode = 1;
});
