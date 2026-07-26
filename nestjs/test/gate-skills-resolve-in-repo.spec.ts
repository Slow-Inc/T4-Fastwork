/**
 * A gate the rules make mandatory must be resolvable from the repository — or the rules must say where
 * it comes from (#251).
 *
 * Measured 2026-07-27: `.agents/skills/` tracks 47 skills, including `using-t4`, `karpathy-guidelines`,
 * `scrutinize` and `security-review`. But **`code-review`, `t4-dev-workflow` and `tdd` are not there at
 * all** — they resolve only from a user-level install. Meanwhile `CLAUDE.md` states "Repository skill
 * instructions are canonical in `.agents/skills/`", which is false for exactly the skills that decide
 * whether work is allowed to land.
 *
 * Consequence: a fresh clone, or a different agent, has part of the mandatory pipeline missing and no
 * way to know which part.
 *
 * The fix this test permits is deliberately either/or, because vendoring third-party skill bodies is
 * not a decision a test should force: a gate may live in the repo, OR it may be declared as an external
 * dependency with its source. What is forbidden is the third state — named as mandatory, resolvable
 * nowhere, and silently assumed present. That is the same defect as claiming a hook that does not
 * exist, one layer up.
 */
import { describe, expect, it } from 'bun:test';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const REPO_ROOT = join(import.meta.dir, '..', '..');
const claudeMd = readFileSync(join(REPO_ROOT, 'CLAUDE.md'), 'utf8');

/**
 * The skills `CLAUDE.md` makes mandatory for work to land: the session-start pair, the delivery
 * pipeline's own map, and the three review gates. Not every skill the repo mentions — only the ones
 * whose absence means a gate silently does not run.
 */
const MANDATORY_GATE_SKILLS = [
  'using-t4',
  'karpathy-guidelines',
  't4-dev-workflow',
  'tdd',
  'code-review',
  'scrutinize',
  'security-review',
];

const EXTERNAL_START = '<!-- external-skills:start -->';
const EXTERNAL_END = '<!-- external-skills:end -->';

/** Names listed in the external-dependency block, if the block exists. */
function declaredExternal(): string[] {
  const start = claudeMd.indexOf(EXTERNAL_START);
  const end = claudeMd.indexOf(EXTERNAL_END);
  if (start === -1 || end === -1 || end < start) return [];
  const block = claudeMd.slice(start + EXTERNAL_START.length, end);
  return (block.match(/`([a-z0-9-]+)`/g) ?? []).map((m) => m.slice(1, -1));
}

function resolvesInRepo(skill: string): boolean {
  return existsSync(join(REPO_ROOT, '.agents', 'skills', skill, 'SKILL.md'));
}

describe('every mandatory gate skill resolves in the repo, or is declared external (#251)', () => {
  const external = declaredExternal();

  it.each(MANDATORY_GATE_SKILLS.map((s) => [s] as const))('%s', (skill) => {
    const inRepo = resolvesInRepo(skill);
    expect(
      inRepo || external.includes(skill),
      `\`${skill}\` is named as a mandatory gate but neither exists at ` +
        `.agents/skills/${skill}/SKILL.md nor appears in CLAUDE.md's external-skills block. ` +
        `A fresh clone would silently lack this gate. Either vendor it, or declare where it comes ` +
        `from so it can be installed.`,
    ).toBe(true);
  });

  it('does not declare a skill external while also shipping it in the repo', () => {
    // Two sources of truth for the same gate is how a stale copy starts being followed.
    const both = external.filter((s) => resolvesInRepo(s));
    expect(
      both,
      'These are declared external AND present in .agents/skills/ — pick one: ' + both.join(', '),
    ).toEqual([]);
  });
});
