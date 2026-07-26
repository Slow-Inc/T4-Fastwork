/**
 * A document may not claim mechanical enforcement the repository cannot show (#251).
 *
 * Measured 2026-07-27: `CLAUDE.md` states the PR/issue rule "is **hook-enforced** (`gh pr create` is
 * denied with no referenced issue)" and, elsewhere, "unlike `gh pr create/merge`, which are gated".
 * Neither is true here — this repo has no `PreToolUse` hook and no `.claude/t4.json`;
 * `.claude/settings.local.json` carries only a `SessionStart` hook. So the dangerous-git denial the
 * workflow rules describe is absent too.
 *
 * Why that matters enough to test: believing part of the pipeline is automatic is what makes the
 * non-automatic part easy to drop. A manual gate honestly labelled manual gets run; a manual gate
 * dressed as a hook gets trusted to something that does not exist.
 *
 * The invariant is doc↔repo agreement, NOT doc↔doc. The test does not check that the document contains
 * some blessed sentence — that kind of assertion passes by construction and breaks on any rewrite. It
 * checks that every enforcement claim names an artifact, and that the artifact is really there. It
 * therefore keeps passing when a hook is genuinely added, and starts failing the moment a claim
 * outlives its implementation.
 *
 * Placed with the other repo-wide invariants (`drizzle-folder-is-history`,
 * `pipeline-nothing-dropped-silently`) because `nestjs/` is where a `bun test` runner already exists;
 * the subject is the repository, not the backend.
 */
import { describe, expect, it } from 'bun:test';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const REPO_ROOT = join(import.meta.dir, '..', '..');
const CLAUDE_MD = join(REPO_ROOT, 'CLAUDE.md');

const TABLE_START = '<!-- enforcement-table:start -->';
const TABLE_END = '<!-- enforcement-table:end -->';

/**
 * Phrases that assert something is enforced by machinery. Outside the enforcement table they are
 * unverifiable claims; inside it they sit next to the artifact that proves them.
 */
const CLAIM_PHRASES = [
  'hook-enforced',
  'hook enforced',
  'which are gated',
  'is gated',
  'are gated',
];

const claudeMd = readFileSync(CLAUDE_MD, 'utf8');

function splitOnTable(src: string): { inside: string; outside: string } {
  const start = src.indexOf(TABLE_START);
  const end = src.indexOf(TABLE_END);
  if (start === -1 || end === -1 || end < start) {
    return { inside: '', outside: src };
  }
  return {
    inside: src.slice(start + TABLE_START.length, end),
    outside: src.slice(0, start) + src.slice(end + TABLE_END.length),
  };
}

describe('CLAUDE.md has one enforcement table, and it is the only place enforcement is claimed (#251)', () => {
  it('delimits the enforcement table with machine-findable markers', () => {
    // The markers are what let the rest of these assertions be mechanical rather than prose-guessing.
    expect(
      claudeMd.includes(TABLE_START) && claudeMd.includes(TABLE_END),
      `CLAUDE.md must contain ${TABLE_START} … ${TABLE_END} around the enforcement-status table.`,
    ).toBe(true);
  });

  it('makes no enforcement claim outside that table', () => {
    const { outside } = splitOnTable(claudeMd);
    const strays = CLAIM_PHRASES.filter((p) => outside.includes(p));
    expect(
      strays,
      'These phrases claim mechanical enforcement outside the enforcement table, where nothing ' +
        'verifies them. Move the claim into the table (with its artifact), or delete it: ' +
        strays.join(', '),
    ).toEqual([]);
  });

  it('backs every claimed control with an artifact that exists in this repo', () => {
    const { inside } = splitOnTable(claudeMd);
    const rows = inside
      .split('\n')
      .filter((l) => l.trim().startsWith('|'))
      .map((l) => l.split('|').map((c) => c.trim()))
      // Drop the |---|---| separator, then the header. The alignment colons matter: a separator
      // written `|:---|` would survive a `/^-+$/` test, `.slice(1)` would then eat the separator
      // instead of the header, and the header's own "Evidence" cell would be demanded as an
      // artifact — a false failure caused purely by reformatting the table.
      .filter((cells) => cells.length >= 4 && !/^:?-+:?$/.test(cells[2] ?? ''))
      .slice(1);

    expect(rows.length, 'the enforcement table must have at least one row').toBeGreaterThan(0);

    const unbacked: string[] = [];
    for (const cells of rows) {
      const [, control, status, evidence] = cells;
      // A row that admits it is discipline needs no artifact — that is the honest case.
      if (/discipline|manual|not established/i.test(status)) continue;
      // Anything else claims machinery, so the evidence cell must name a path that is really here.
      const paths = (evidence.match(/`([^`]+)`/g) ?? []).map((m) => m.slice(1, -1));
      const found = paths.some((p) => existsSync(join(REPO_ROOT, p)));
      if (!found) unbacked.push(`${control} → ${evidence || '(no evidence given)'}`);
    }

    expect(
      unbacked,
      'These rows claim enforcement but name no artifact that exists in this checkout. Either add ' +
        'the implementation, or set the status to "discipline only": ' + unbacked.join(' ; '),
    ).toEqual([]);
  });
});
