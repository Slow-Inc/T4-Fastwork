/**
 * The guard evaluator must fail when a server-side setting stops being true (#279).
 *
 * `CLAUDE.md`'s enforcement table is only trustworthy if a claim that decays gets caught. The table
 * names `scripts/check-repo-guards.ts`; this pins the decision that script reports on, using fixtures
 * shaped like the real API responses — including the exact shape the API returns when protection is
 * absent, which is what the repository looked like until 2026-07-28.
 */
import { describe, expect, it } from 'bun:test';
import {
  REQUIRED_CHECK,
  deliberatelyUnenforced,
  findGuardGaps,
  type ProtectionResponse,
  type SecurityResponse,
} from '../src/github/repo-guards';

const GOOD_PROTECTION: ProtectionResponse = {
  required_status_checks: { strict: true, contexts: ['gate'] },
  enforce_admins: { enabled: false },
  allow_force_pushes: { enabled: false },
  allow_deletions: { enabled: false },
};

const GOOD_SECURITY: SecurityResponse = {
  secret_scanning: { status: 'enabled' },
  secret_scanning_push_protection: { status: 'enabled' },
  dependabot_security_updates: { status: 'enabled' },
};

describe('findGuardGaps (#279)', () => {
  it('reports nothing when every guard is on', () => {
    expect(findGuardGaps(GOOD_PROTECTION, GOOD_SECURITY)).toEqual([]);
  });

  it('reports an unprotected branch, the state this repo was in until 2026-07-28', () => {
    // The API answers 404 "Branch not protected"; the script passes null for that.
    const gaps = findGuardGaps(null, GOOD_SECURITY);
    expect(gaps.map((g) => g.guard)).toContain('branch protection');
  });

  it('reports protection that requires the wrong checks', () => {
    // Requiring the individual jobs instead of the gate is the deadlock trap, so it must not pass.
    const gaps = findGuardGaps(
      {
        ...GOOD_PROTECTION,
        required_status_checks: { strict: true, contexts: ['test', 'build'] },
      },
      GOOD_SECURITY,
    );
    const finding = gaps.find((g) => g.guard === 'required status check');
    expect(finding?.expected).toContain(REQUIRED_CHECK);
    expect(finding?.actual).toBe('test, build');
  });

  it('reports protection that requires no check at all', () => {
    const gaps = findGuardGaps(
      { ...GOOD_PROTECTION, required_status_checks: { strict: true } },
      GOOD_SECURITY,
    );
    expect(
      gaps.find((g) => g.guard === 'required status check')?.actual,
    ).toBe('none required');
  });

  it('reports a stale-base merge being allowed', () => {
    const gaps = findGuardGaps(
      {
        ...GOOD_PROTECTION,
        required_status_checks: { strict: false, contexts: ['gate'] },
      },
      GOOD_SECURITY,
    );
    expect(gaps.map((g) => g.guard)).toContain(
      'branch up to date before merging',
    );
  });

  it('reports force pushes or branch deletion being re-enabled', () => {
    const gaps = findGuardGaps(
      {
        ...GOOD_PROTECTION,
        allow_force_pushes: { enabled: true },
        allow_deletions: { enabled: true },
      },
      GOOD_SECURITY,
    );
    const names = gaps.map((g) => g.guard);
    expect(names).toContain('force push to the default branch');
    expect(names).toContain('deletion of the default branch');
  });

  it.each([
    ['secret_scanning', 'secret scanning'],
    ['secret_scanning_push_protection', 'secret scanning push protection'],
    ['dependabot_security_updates', 'dependabot security updates'],
  ])('reports %s being switched off', (key: string, label: string) => {
    const gaps = findGuardGaps(GOOD_PROTECTION, {
      ...GOOD_SECURITY,
      [key]: { status: 'disabled' },
    });
    expect(gaps.map((g) => g.guard)).toContain(label);
    expect(gaps.find((g) => g.guard === label)?.actual).toBe('disabled');
  });

  it('treats a missing security block as a gap, not as a pass', () => {
    // Fail closed: an API shape we did not expect must not read as "everything is fine".
    const gaps = findGuardGaps(GOOD_PROTECTION, null);
    expect(gaps.length).toBe(3);
    for (const g of gaps) expect(g.actual).toBe('absent from the response');
  });
});

describe('deliberatelyUnenforced (#279)', () => {
  it('records that admin override is a choice, so its absence is not read as a gap', () => {
    const notes = deliberatelyUnenforced(GOOD_PROTECTION);
    expect(notes.length).toBe(1);
    expect(notes[0]).toContain('escape hatch');
  });

  it('says nothing when admins are also bound', () => {
    expect(
      deliberatelyUnenforced({
        ...GOOD_PROTECTION,
        enforce_admins: { enabled: true },
      }),
    ).toEqual([]);
  });
});
