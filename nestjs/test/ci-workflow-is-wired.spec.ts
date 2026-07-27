/**
 * The CI workflow must actually be wired to run, and to run the repository's own commands (#277).
 *
 * This asserts the workflow's *structure*, parsed as YAML — not that the file contains blessed
 * strings, which would break on any reformat and prove nothing. The realistic regression is someone
 * editing the workflow and dropping a job, changing the trigger, or inlining commands that then drift
 * from what a developer runs.
 *
 * Two of the assertions exist because a sibling repository already paid for them:
 *
 * - **Only a single `gate` job may be the required check.** GitHub required status checks plus
 *   conditional jobs deadlock — a PR that skips a job leaves its required check in "Expected —
 *   waiting for status" forever and can never merge. `Slow-Inc/MangaDock`'s `ci.yml` documents this;
 *   the fix is one always-run `gate` that inspects the others' results.
 * - **A job id may not contain a hyphen.** `${{ needs.mit-logic }}` parses the hyphen as subtraction,
 *   so the expression silently evaluates to nothing rather than failing loudly.
 */
import { describe, expect, it } from 'bun:test';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const WORKFLOW = join(
  import.meta.dir,
  '..',
  '..',
  '.github',
  'workflows',
  'ci.yml',
);

interface Job {
  if?: string;
  needs?: string[] | string;
  steps?: { uses?: string; run?: string; with?: Record<string, unknown> }[];
}
interface Workflow {
  on?: Record<string, unknown>;
  jobs?: Record<string, Job>;
}

function loadWorkflow(): Workflow {
  const raw = readFileSync(WORKFLOW, 'utf8');
  return (Bun as unknown as { YAML: { parse(s: string): unknown } }).YAML.parse(
    raw,
  ) as Workflow;
}

describe('the CI workflow is wired to run (#277)', () => {
  it('exists where GitHub looks for it', () => {
    expect(
      existsSync(WORKFLOW),
      '.github/workflows/ci.yml must exist — a workflow anywhere else does not run',
    ).toBe(true);
  });

  it('triggers on pull requests and on pushes to master', () => {
    const wf = loadWorkflow();
    const on = wf.on ?? {};
    expect(
      Object.keys(on),
      'the workflow must trigger on pull_request; without it a PR gets no check at all',
    ).toContain('pull_request');
    const push = on.push as { branches?: string[] } | undefined;
    expect(
      push?.branches,
      'it must also run on master, so a semantic conflict between two green PRs is caught',
    ).toContain('master');
  });

  it('defines more than one job, so a passing scan means something', () => {
    const jobs = loadWorkflow().jobs ?? {};
    expect(Object.keys(jobs).length).toBeGreaterThan(1);
  });

  it('runs the repository root scripts rather than inlining workspace commands', () => {
    // The root entry point (#276) exists so CI and a developer cannot drift apart. A workflow that
    // spells out `cd nextjs && ...` has its own copy of the truth.
    const jobs = loadWorkflow().jobs ?? {};
    const runs = Object.values(jobs)
      .flatMap((j) => j.steps ?? [])
      .map((s) => s.run ?? '')
      .join('\n');
    expect(runs, 'a job must call the root test script').toContain(
      'bun run test',
    );
    expect(runs, 'a job must call the root build script').toContain(
      'bun run build',
    );
    expect(
      runs.includes('cd nextjs') || runs.includes('cd nestjs'),
      'the workflow must not cd into a workspace — that is the duplication #276 removed',
    ).toBe(false);
  });

  it('has exactly one always-run gate job that summarizes the others', () => {
    const jobs = loadWorkflow().jobs ?? {};
    const gate = jobs.gate;
    expect(gate, 'a job named "gate" must exist — it is the only required check').toBeTruthy();
    expect(
      gate?.if ?? '',
      'gate must run even when a job it depends on failed or was skipped',
    ).toContain('always()');
    const needs = Array.isArray(gate?.needs) ? gate.needs : [gate?.needs ?? ''];
    expect(needs, 'gate must depend on the test job').toContain('test');
    expect(needs, 'gate must depend on the build job').toContain('build');
  });

  it('pins bun to an exact version rather than latest', () => {
    // `latest` makes CI a moving target: a Bun release can turn a green branch red with no diff.
    const jobs = loadWorkflow().jobs ?? {};
    const versions = Object.values(jobs)
      .flatMap((j) => j.steps ?? [])
      .filter((s) => (s.uses ?? '').startsWith('oven-sh/setup-bun'))
      .map((s) => String(s.with?.['bun-version'] ?? ''));

    expect(versions.length, 'at least one job must set up bun').toBeGreaterThan(
      0,
    );
    for (const v of versions) {
      expect(v, 'bun-version must be pinned, not "latest"').not.toBe('latest');
      expect(v, 'bun-version must look like a real version').toMatch(
        /^\d+\.\d+\.\d+$/,
      );
    }
  });

  it('uses no hyphen in any job id', () => {
    // `${{ needs.some-job }}` reads the hyphen as subtraction and evaluates to nothing, silently.
    const ids = Object.keys(loadWorkflow().jobs ?? {});
    const hyphenated = ids.filter((id) => id.includes('-'));
    expect(
      hyphenated,
      'rename these job ids with underscores — a hyphen breaks needs.<id> expressions: ' +
        hyphenated.join(', '),
    ).toEqual([]);
  });
});
