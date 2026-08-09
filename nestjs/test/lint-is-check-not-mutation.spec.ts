/**
 * `lint` must be a check, not a mutation (#280).
 *
 * The nestjs `lint` script was `eslint … --fix` — it rewrote the working tree on every run, which is
 * why files sat permanently modified and every commit needed manual path-intersection. It is also why
 * `lint` could never become a required check: running it changed the tree, so a clean-checkout run
 * could never leave `git status` unchanged.
 *
 * This spec holds the split: `lint` is the checking form in both workspaces, `lint:fix` is the
 * explicit mutation form, the root `lint` routes to the workspace checks, and one formatter of record
 * (a root `.prettierrc`) is what both eslint and prettier read — so running either produces no diff
 * against the other. It also pins that the one security-boundary file is excluded from the formatter
 * (AFK: a boundary file is not reformatted unattended), not silently re-added to the pass.
 */
import { describe, expect, it } from 'bun:test';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = join(import.meta.dir, '..', '..');

function readJson(rel: string): { scripts?: Record<string, string> } {
  return JSON.parse(readFileSync(join(ROOT, rel), 'utf8')) as {
    scripts?: Record<string, string>;
  };
}

describe('lint is a check, not a mutation (#280)', () => {
  it('nestjs lint does not write — no --fix in the lint script', () => {
    const lint = readJson('nestjs/package.json').scripts?.lint ?? '';
    expect(
      lint,
      'nestjs lint must not contain --fix (running it is a check, not a mutation)',
    ).not.toContain('--fix');
  });

  it('nextjs lint does not write', () => {
    const lint = readJson('nextjs/package.json').scripts?.lint ?? '';
    expect(lint, 'nextjs lint must not contain --fix').not.toContain('--fix');
  });

  it('both workspaces expose the explicit mutation form as lint:fix', () => {
    expect(
      readJson('nestjs/package.json').scripts?.['lint:fix'] ?? '',
    ).toContain('--fix');
    expect(
      readJson('nextjs/package.json').scripts?.['lint:fix'] ?? '',
    ).toContain('--fix');
  });

  it('the root lint routes to the workspace checks (bun --filter lint)', () => {
    const lint = readJson('package.json').scripts?.lint ?? '';
    expect(lint).toContain('--filter');
    expect(lint).toContain('lint');
  });

  it('one formatter of record lives at the root and is what prettier reads', () => {
    expect(
      existsSync(join(ROOT, '.prettierrc')),
      'a root .prettierrc is the single formatter config',
    ).toBe(true);
    // A nestjs/.prettierrc would SHADOW the root config for every nestjs file (prettier uses the
    // nearest config), silently re-introducing an endOfLine that disagrees with eslint's rule.
    expect(
      existsSync(join(ROOT, 'nestjs', '.prettierrc')),
      'nestjs/.prettierrc must not exist — it would shadow the root formatter config',
    ).toBe(false);
    const config = JSON.parse(
      readFileSync(join(ROOT, '.prettierrc'), 'utf8'),
    ) as {
      singleQuote?: boolean;
      trailingComma?: string;
      endOfLine?: string;
    };
    expect(config.singleQuote).toBe(true);
    expect(config.trailingComma).toBe('all');
    expect(
      config.endOfLine,
      "eslint's prettier rule sets endOfLine auto — the config must agree or prettier and eslint would fight over line endings",
    ).toBe('auto');
  });

  it('the eslint prettier rule agrees with the root config (same endOfLine)', () => {
    const eslint = readFileSync(
      join(ROOT, 'nestjs', 'eslint.config.mjs'),
      'utf8',
    );
    expect(
      eslint,
      "eslint's prettier/prettier rule must use endOfLine auto to match the root config",
    ).toMatch(/endOfLine:\s*["']auto["']/);
  });

  it('the security-boundary file is excluded from the formatter, not silently re-added', () => {
    const prettierignore = readFileSync(join(ROOT, '.prettierignore'), 'utf8');
    expect(
      prettierignore,
      'nestjs/src/security/turnstile.verifier.ts must stay out of the formatting pass (AFK boundary)',
    ).toContain('nestjs/src/security/turnstile.verifier.ts');
    const eslint = readFileSync(
      join(ROOT, 'nestjs', 'eslint.config.mjs'),
      'utf8',
    );
    expect(
      eslint,
      "eslint must not flag the excluded file's formatting — its prettier/prettier rule is off for it",
    ).toMatch(/src\/security\/turnstile\.verifier\.ts/);
  });
});
