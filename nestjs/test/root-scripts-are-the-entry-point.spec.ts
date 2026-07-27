/**
 * CI and a human must invoke the same commands (#276).
 *
 * The root `package.json` had no scripts at all, so a CI workflow would have to carry its own copy of
 * the commands — and a copy drifts. That drift is how "it works locally" and "CI is green" come to
 * disagree, and it is the thing this repository cannot afford while agents open most of the PRs.
 *
 * The invariant is deliberately about the ENTRY POINT, not about what the entry point runs: a future
 * `verify` may gain jobs, but it may never quietly lose the two that make it meaningful — the tests and
 * the type-check, which are different checks and fail for different reasons (`bun test` does not
 * type-check; that is how a broken build reached a PR head on 2026-07-26).
 */
import { describe, expect, it } from 'bun:test';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = join(import.meta.dir, '..', '..');

function scriptsOf(pkgDir: string): Record<string, string> {
  const raw = readFileSync(join(pkgDir, 'package.json'), 'utf8');
  return (JSON.parse(raw) as { scripts?: Record<string, string> }).scripts ?? {};
}

const root = scriptsOf(ROOT);

describe('the repository has one entry point (#276)', () => {
  it('defines the scripts CI is allowed to call', () => {
    for (const name of ['test', 'build', 'lint', 'verify']) {
      expect(root[name], `root package.json must define a "${name}" script`).toBeTruthy();
    }
  });

  it('verify covers both the tests and the type-check', () => {
    // Not "verify exists" — verify that has quietly become tests-only is the failure mode, and it
    // reads as green while a type error walks past it.
    const verify = root.verify ?? '';
    expect(verify).toContain('test');
    expect(verify).toContain('build');
  });

  it('delegates to the workspaces rather than duplicating their commands', () => {
    // A root script that reimplements `next build` would drift from the workspace the day either
    // changes. Filtering is the delegation; hand-written cd chains are the duplication.
    for (const name of ['test', 'build', 'lint']) {
      expect(root[name] ?? '', `root "${name}" should delegate to the workspaces`).toContain(
        '--filter',
      );
    }
  });

  it('leaves each workspace owning its own scripts', () => {
    for (const ws of ['nextjs', 'nestjs']) {
      const s = scriptsOf(join(ROOT, ws));
      expect(s.test, `${ws} must keep its own test script`).toBeTruthy();
      expect(s.build, `${ws} must keep its own build script`).toBeTruthy();
    }
  });
});
