/**
 * The migration-drift workflow must stay wired to run (#282). Like `gate-audit-workflow-is-wired.spec.ts`,
 * this asserts structure parsed as YAML: a scheduled trigger, a run that calls the committed script,
 * and the `DATABASE_URL` guard that lets the job no-op honestly until the secret exists instead of
 * failing while armed.
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
  'migration-drift.yml',
);

interface Workflow {
  on?: Record<string, unknown>;
  permissions?: Record<string, unknown>;
  jobs?: Record<string, { steps?: { run?: string }[] }>;
}

function loadWorkflow(): Workflow {
  const raw = readFileSync(WORKFLOW, 'utf8');
  return (Bun as unknown as { YAML: { parse(s: string): unknown } }).YAML.parse(
    raw,
  ) as Workflow;
}

describe('the migration-drift workflow is wired to run (#282)', () => {
  it('exists where GitHub looks for it', () => {
    expect(existsSync(WORKFLOW)).toBe(true);
  });

  it('triggers on a schedule — it describes production, not a diff', () => {
    expect(loadWorkflow().on?.schedule).toBeTruthy();
  });

  it('runs the committed read-only script and guards on the DATABASE_URL secret', () => {
    const jobs = loadWorkflow().jobs ?? {};
    const runs = Object.values(jobs)
      .flatMap((j) => j.steps ?? [])
      .map((s) => s.run ?? '')
      .join('\n');
    expect(runs).toContain('nestjs/scripts/migration-drift.ts');
    expect(runs).toContain('DATABASE_URL');
    expect(runs).toContain('no-op');
  });
});
