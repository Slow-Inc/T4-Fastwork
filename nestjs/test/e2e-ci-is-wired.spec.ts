/**
 * The E2E browser suite must run on anything that can affect the rendered site (#278).
 *
 * `CLAUDE.md` requires `bun run e2e` for every frontend change because unit tests cannot see real
 * layout/hydration — the navbar-overlap bug passed every unit test and only E2E caught it. Today that
 * requirement is honoured only when a person remembers.
 *
 * The trigger must be inverted: E2E runs by default, and only provably-unrelated paths (docs, the
 * knowledge vault, agent skill definitions, workflow config) skip it. A `paths: nextjs/**` filter is
 * wrong here — a change under `nestjs/src/github/` alters what the frontend renders, and data changes
 * reach the pages. This spec holds the workflow to that contract, mirroring
 * `ci-workflow-is-wired.spec.ts`.
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
  needs?: string[] | string;
  env?: Record<string, string>;
  steps?: { run?: string }[];
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

describe('the e2e job is wired into CI (#278)', () => {
  it('defines an e2e job', () => {
    expect(loadWorkflow().jobs?.e2e, 'ci.yml must define an e2e job').toBeTruthy();
  });

  it('runs the repository\'s own browser suite command', () => {
    const runs = (loadWorkflow().jobs?.e2e?.steps ?? [])
      .map((s) => s.run ?? '')
      .join('\n');
    expect(runs).toContain('bun run e2e');
  });

  it('runs by default — the workflow uses no paths include list', () => {
    const on = loadWorkflow().on ?? {};
    const pr = on.pull_request as { paths?: unknown } | undefined;
    expect(
      pr?.paths,
      'a paths include list is never used — E2E runs unless a changed file is provably unrelated',
    ).toBeUndefined();
  });

  it('is supplied the Supabase configuration from repository secrets', () => {
    const env = loadWorkflow().jobs?.e2e?.env ?? {};
    expect(
      env.NEXT_PUBLIC_SUPABASE_URL ?? '',
      'the build and suite need the real Supabase URL, from a secret',
    ).toContain('secrets.');
    expect(
      env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? '',
      'the build and suite need the publishable key, from a secret',
    ).toContain('secrets.');
  });

  it('documents that the suite reads the production database', () => {
    const job = loadWorkflow().jobs?.e2e;
    const text = JSON.stringify(job);
    expect(
      text.toLowerCase(),
      'the job must state plainly that it reads the production database, so a content change can fail CI with no code defect',
    ).toContain('production database');
  });

  it('lists only provably-unrelated paths in paths-ignore', () => {
    const ignore = (loadWorkflow().jobs?.e2e?.env?.E2E_IGNORE_PATHS ?? '')
      .split('\n')
      .map((p) => p.trim())
      .filter(Boolean);
    expect(ignore.length, 'the paths-ignore list must be populated').toBeGreaterThan(0);
    // Patterns that CAN affect the rendered site — a future edit must not add one of these.
    const siteAffecting = [
      /^nestjs\//,
      /^nextjs\/app/,
      /^nextjs\/components/,
      /^nextjs\/lib/,
      /^nextjs\/content/,
      /^nextjs\/e2e/,
      /^nextjs\/public/,
      /^nextjs\/scripts/,
      /^nextjs\/package\.json/,
      /^\.github\/workflows\//,
    ];
    for (const entry of ignore) {
      for (const re of siteAffecting) {
        expect(
          re.test(entry),
          `ignore entry "${entry}" can affect the rendered site (matches ${re})`,
        ).toBe(false);
      }
    }
  });

  it('the gate job requires the e2e result', () => {
    const needs = loadWorkflow().jobs?.gate?.needs;
    const list = Array.isArray(needs) ? needs : [needs ?? ''];
    expect(list, 'gate must depend on e2e so a browser failure blocks the merge').toContain(
      'e2e',
    );
  });
});
