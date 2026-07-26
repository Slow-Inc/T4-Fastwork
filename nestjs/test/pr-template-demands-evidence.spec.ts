/**
 * The PR template asks for a SHA and URLs, not adjectives (#253).
 *
 * The template is a form, so this is a check on a form's fields — not on prose. It is the one part of
 * #253 worth asserting mechanically: if a field is renamed away, the audit script that reads the SHA
 * back out of the PR silently stops finding anything, and a skipped gate becomes invisible again.
 *
 * What this deliberately does NOT check: the wording of the guidance comments. Asserting prose contains
 * a sentence passes by construction and breaks on any rewrite.
 */
import { describe, expect, it } from 'bun:test';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const TEMPLATE = join(
  import.meta.dir,
  '..',
  '..',
  '.github',
  'pull_request_template.md',
);

describe('.github/pull_request_template.md carries the gate receipt (#253)', () => {
  it('exists — GitHub only pre-fills a PR body if the file is at this path', () => {
    expect(existsSync(TEMPLATE), `expected a template at ${TEMPLATE}`).toBe(
      true,
    );
  });

  const body = existsSync(TEMPLATE) ? readFileSync(TEMPLATE, 'utf8') : '';

  it('asks for the reviewed HEAD as a full SHA, and says where to get it', () => {
    expect(/reviewed head/i.test(body)).toBe(true);
    // The "full 40-char" instruction is load-bearing: the audit cannot match an abbreviation against
    // the merged head, and `git rev-parse` is named because an invented SHA has been stamped before.
    expect(/40-char/i.test(body) && /rev-parse/i.test(body)).toBe(true);
  });

  it('asks for an evidence URL for each required gate', () => {
    for (const gate of ['code-review', 'scrutinize', 'security-review']) {
      expect(
        body.includes(gate),
        `template must have a field for ${gate}`,
      ).toBe(true);
    }
    expect(/comment URL/i.test(body)).toBe(true);
  });

  it('states that the gate applies to docs-only changes', () => {
    // The exact proxy that was used to skip the gate four times. If this line ever goes, the template
    // stops contradicting the heuristic at the moment the PR is written.
    expect(/docs-only/i.test(body)).toBe(true);
  });

  it('uses fields, not pre-tickable checkboxes, for the evidence itself', () => {
    // A `- [ ]` next to "scrutinize evidence" can be ticked without producing anything. A blank after
    // "PR comment URL:" cannot be faked as cheaply.
    const evidenceLines = body
      .split('\n')
      .filter((l) =>
        /code-review evidence|scrutinize evidence|Reviewed HEAD/i.test(l),
      );
    expect(evidenceLines.length).toBeGreaterThan(0);
    expect(evidenceLines.filter((l) => l.includes('- [ ]'))).toEqual([]);
  });
});
