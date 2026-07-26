/**
 * Which merged PRs landed without gate evidence (#253). Pure — the `gh` calls live in the script.
 *
 * This exists because on 2026-07-26 four PRs merged without the mandated `code-review` + `scrutinize`
 * evidence and **nothing failed**, so the same mistake repeated three more times. #251 made the rule
 * harder to misread; it cannot make a skip visible. This is the part that can.
 *
 * The expected values come from the repository's real history, not from re-deriving what the code does:
 * PRs #244, #245, #246 and #249 merged with no review comment, while #243 and #250 merged with one. A
 * test that only asserted "the function returns what the function computes" would be worthless here —
 * the point is to agree with GitHub.
 */
import { describe, expect, it } from 'bun:test';
import { findUnreviewedMerges, type MergedPr } from '../src/github/gate-audit';

/** A PR that did take the gate: evidence quoting the SHA that was actually merged. */
const compliant: MergedPr = {
  number: 250,
  mergedHeadSha: '1608065d6a2f64805da80e5de983e9112dadf7e9',
  comments: [
    'Pre-merge review — reviewed HEAD `1608065d6a2f64805da80e5de983e9112dadf7e9`\n' +
      'code-review (both axes) and scrutinize run in-session...',
  ],
};

describe('findUnreviewedMerges — a skipped gate leaves a trace (#253)', () => {
  it('passes a PR whose evidence quotes the merged HEAD and names both gates', () => {
    expect(findUnreviewedMerges([compliant])).toEqual([]);
  });

  it('flags a PR with no comments at all', () => {
    const bare: MergedPr = {
      number: 244,
      mergedHeadSha: 'a'.repeat(40),
      comments: [],
    };
    const found = findUnreviewedMerges([bare]);
    expect(found).toHaveLength(1);
    expect(found[0]).toMatchObject({ number: 244, reason: 'no-evidence' });
  });

  it('flags a PR whose comments discuss neither gate, however chatty', () => {
    const chatty: MergedPr = {
      number: 246,
      mergedHeadSha: 'b'.repeat(40),
      comments: ['LGTM, merging', 'ran the tests locally, all green'],
    };
    expect(findUnreviewedMerges([chatty])[0]).toMatchObject({
      reason: 'no-evidence',
    });
  });

  it('flags evidence that reviewed an EARLIER commit as stale, not as reviewed', () => {
    // The real case from 2026-07-26: PR #252's first review ran at 15932e3, HEAD then moved for a
    // review finding. `CLAUDE.md` says both reviews are stale when HEAD changes — so evidence about a
    // commit that was not the one merged must not count, or the audit rubber-stamps exactly the
    // situation the re-run rule exists for.
    const moved: MergedPr = {
      number: 252,
      mergedHeadSha: '40bb717fc60a5bc4f7571fe1a58cae60cfd96c73',
      comments: [
        'Pre-merge gate — reviewed HEAD `15932e37850a998f94218ed7951bbcfabd3bbd8e`. ' +
          'code-review and scrutinize both run.',
      ],
    };
    expect(findUnreviewedMerges([moved])[0]).toMatchObject({
      number: 252,
      reason: 'stale-evidence',
      reviewedSha: '15932e37850a998f94218ed7951bbcfabd3bbd8e',
    });
  });

  it('flags evidence at the right commit that only ran one of the two gates', () => {
    const half: MergedPr = {
      number: 999,
      mergedHeadSha: 'c'.repeat(40),
      comments: [`code-review done at \`${'c'.repeat(40)}\` — no findings.`],
    };
    expect(findUnreviewedMerges([half])[0]).toMatchObject({
      reason: 'incomplete-evidence',
      missing: ['scrutinize'],
    });
  });

  it('does not accept a short SHA as identifying the merged head', () => {
    // An abbreviation cannot be checked against the merged head without guessing its length, and the
    // gate asks for the reviewed HEAD. Accepting `40bb717` would let a wrong-commit review pass.
    // It reports as unidentified rather than stale: the commit is not *wrong*, it is unverifiable —
    // and the fix is "quote the full SHA", not "re-review".
    const short: MergedPr = {
      number: 998,
      mergedHeadSha: '40bb717fc60a5bc4f7571fe1a58cae60cfd96c73',
      comments: ['code-review + scrutinize at `40bb717`'],
    };
    expect(findUnreviewedMerges([short])[0]).toMatchObject({
      reason: 'unidentified-evidence',
    });
  });

  it('separates "cannot tell what was reviewed" from "reviewed the wrong commit"', () => {
    // Found by running the audit over the repo's real history: most pre-#251 PRs carry a review comment
    // that names both gates but quotes no full SHA at all. Calling that `stale-evidence` is wrong — it
    // is not evidence about another commit, it is evidence that does not say which commit. The fixes
    // differ (quote the SHA vs re-review), so the reasons must differ too.
    const unidentified: MergedPr = {
      number: 210,
      mergedHeadSha: 'e'.repeat(40),
      comments: ['code-review + scrutinize done, no findings.'],
    };
    expect(findUnreviewedMerges([unidentified])[0]).toMatchObject({
      number: 210,
      reason: 'unidentified-evidence',
    });
  });

  it('reports each offending PR once and leaves compliant ones out', () => {
    const found = findUnreviewedMerges([
      compliant,
      { number: 244, mergedHeadSha: 'a'.repeat(40), comments: [] },
      {
        number: 245,
        mergedHeadSha: 'd'.repeat(40),
        comments: ['docs only, merging'],
      },
    ]);
    expect(found.map((g) => g.number)).toEqual([244, 245]);
  });
});
