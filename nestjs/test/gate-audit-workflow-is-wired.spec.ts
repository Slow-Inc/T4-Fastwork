/**
 * The pre-merge gate audit must run on a schedule, not only when someone remembers to type it (#283).
 *
 * `CLAUDE.md` and `using-t4` tell every session to run `scripts/gate-audit.ts` at start. A process
 * gate that is only checked when someone feels like checking is not detected — it is trusted, which is
 * the failure mode the audit exists to remove. This spec holds the workflow that makes it a habit.
 *
 * Like `ci-workflow-is-wired.spec.ts`, this asserts structure parsed as YAML, not blessed strings:
 * the realistic regression is an edit that drops the schedule, loses the `issues: write` grant the
 * tracking-issue step needs, or inlines the window computation as a local date (which would audit
 * nothing for anything merged in the local morning — measured on #259).
 */
import { describe, expect, it } from 'bun:test';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { auditExitCode, type GateGap } from '../src/github/gate-audit';

const WORKFLOW = join(
  import.meta.dir,
  '..',
  '..',
  '.github',
  'workflows',
  'gate-audit.yml',
);

interface Step {
  uses?: string;
  run?: string;
}
interface Job {
  steps?: Step[];
}
interface Workflow {
  on?: Record<string, unknown>;
  permissions?: Record<string, unknown>;
  jobs?: Record<string, Job>;
}

function loadWorkflow(): Workflow {
  const raw = readFileSync(WORKFLOW, 'utf8');
  return (Bun as unknown as { YAML: { parse(s: string): unknown } }).YAML.parse(
    raw,
  ) as Workflow;
}

describe('the gate-audit workflow is wired to run (#283)', () => {
  it('exists where GitHub looks for it', () => {
    expect(
      existsSync(WORKFLOW),
      '.github/workflows/gate-audit.yml must exist — a workflow anywhere else does not run',
    ).toBe(true);
  });

  it('triggers on a schedule', () => {
    const on = loadWorkflow().on ?? {};
    expect(
      on.schedule,
      'the audit must run on a schedule; without one it is still only run by hand',
    ).toBeTruthy();
  });

  it('grants issues: write so it can maintain the single tracking issue', () => {
    const permissions = loadWorkflow().permissions ?? {};
    expect(
      permissions.issues,
      'opening or updating the tracking issue needs the issues: write permission',
    ).toBe('write');
  });

  it('runs the committed script with --fail-on-gaps and a UTC window', () => {
    const jobs = loadWorkflow().jobs ?? {};
    const runs = Object.values(jobs)
      .flatMap((j) => j.steps ?? [])
      .map((s) => s.run ?? '')
      .join('\n');
    expect(runs, 'the workflow must call the committed audit script').toContain(
      'scripts/gate-audit.ts',
    );
    expect(
      runs,
      'it must use --fail-on-gaps so a non-empty report is a machine signal, not a grep',
    ).toContain('--fail-on-gaps');
    expect(
      runs,
      'the rolling window must be computed in UTC (date -u) — mergedAt is UTC and a local date silently audits nothing',
    ).toContain('date -u');
  });

  it('uses no hyphen in any job id', () => {
    // `${{ needs.some-job }}` parses a hyphen as subtraction and evaluates to nothing, silently.
    const ids = Object.keys(loadWorkflow().jobs ?? {});
    const hyphenated = ids.filter((id) => id.includes('-'));
    expect(
      hyphenated,
      'rename these job ids with underscores: ' + hyphenated.join(', '),
    ).toEqual([]);
  });
});

describe('auditExitCode — a non-empty report is a machine signal (#283)', () => {
  it('is 0 when nothing failed the audit', () => {
    expect(auditExitCode([])).toBe(0);
  });

  it('is 1 when any PR merged without gate evidence', () => {
    const gaps: GateGap[] = [{ number: 244, reason: 'no-evidence' }];
    expect(auditExitCode(gaps)).toBe(1);
  });

  it('is 1 regardless of why the evidence is unusable', () => {
    const gaps: GateGap[] = [
      { number: 252, reason: 'stale-evidence', reviewedSha: 'a'.repeat(40) },
      { number: 210, reason: 'unidentified-evidence' },
      { number: 999, reason: 'incomplete-evidence', missing: ['scrutinize'] },
    ];
    expect(auditExitCode(gaps)).toBe(1);
  });
});
