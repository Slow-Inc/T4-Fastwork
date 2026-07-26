/**
 * ADR 0015 may not define "additive" differently from the classifier that enforces it (#257).
 *
 * The ADR names the classifier as its safety boundary (decision item 1), so a divergence is not a
 * documentation nit: whichever a future reader trusts, the other one is wrong. Measured 2026-07-27, the
 * two disagreed in *both* directions — the ADR called `create or replace view` additive (the classifier
 * refuses it, because replacing a view changes what an existing anon read returns, and the same shape
 * reaches `is_app_admin()`, SECURITY DEFINER, ADR 0007), and it omitted `create schema/extension if not
 * exists`, which the classifier accepts.
 *
 * The invariant is doc↔code, not doc↔doc. The test does not look for blessed sentences; it takes the SQL
 * examples the ADR itself lists and runs them through `isAdditiveMigration`. So it keeps passing when the
 * classifier legitimately widens and the ADR is updated with it, and fails the moment the prose and the
 * boundary drift apart again.
 */
import { describe, expect, it } from 'bun:test';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { isAdditiveMigration } from '../src/github/additive-migration';

const ADR = join(
  import.meta.dir,
  '..',
  '..',
  'docs',
  'adr',
  '0015-additive-migrations-apply-themselves.md',
);

const adr = readFileSync(ADR, 'utf8');

/**
 * Pull the first backticked span out of every bullet inside a marker-delimited block. The backticks are
 * what make an example machine-extractable — surrounding prose in the bullet is free to explain why.
 */
function examplesIn(marker: string): string[] {
  const start = adr.indexOf(`<!-- ${marker}:start -->`);
  const end = adr.indexOf(`<!-- ${marker}:end -->`);
  if (start === -1 || end === -1 || end < start) return [];
  const block = adr.slice(start, end);
  return block
    .split('\n')
    .filter((l) => l.trim().startsWith('- '))
    .map((l) => l.match(/`([^`]+)`/)?.[1])
    .filter((s): s is string => Boolean(s));
}

describe("ADR 0015's additive list is the classifier's list (#257)", () => {
  it('delimits both lists with machine-findable markers', () => {
    for (const marker of ['additive-shapes', 'refused-shapes']) {
      expect(
        adr.includes(`<!-- ${marker}:start -->`) &&
          adr.includes(`<!-- ${marker}:end -->`),
        `ADR 0015 must delimit its ${marker} list with <!-- ${marker}:start --> … <!-- ${marker}:end -->, ` +
          'so the examples can be fed to the classifier instead of read by eye.',
      ).toBe(true);
    }
  });

  it('classifies every shape it calls additive as additive', () => {
    const examples = examplesIn('additive-shapes');
    expect(
      examples.length,
      'the additive-shapes block must list at least one backticked SQL example',
    ).toBeGreaterThan(0);

    const wrong = examples.filter((sql) => !isAdditiveMigration(sql).additive);
    expect(
      wrong,
      'ADR 0015 calls these additive but the classifier refuses them. Either the ADR is wrong, or the ' +
        'classifier is too narrow — do not "fix" this by deleting the example: ' +
        wrong.join(' ; '),
    ).toEqual([]);
  });

  it('classifies every shape it calls refused as non-additive', () => {
    const examples = examplesIn('refused-shapes');
    expect(
      examples.length,
      'the refused-shapes block must list at least one backticked SQL example',
    ).toBeGreaterThan(0);

    const wrong = examples.filter((sql) => isAdditiveMigration(sql).additive);
    expect(
      wrong,
      'ADR 0015 says these are refused but the classifier would auto-apply them. This is the dangerous ' +
        'direction of the drift: ' +
        wrong.join(' ; '),
    ).toEqual([]);
  });
});
