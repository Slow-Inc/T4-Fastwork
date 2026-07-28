/**
 * Evaluate whether the repository's server-side guards are actually on (#279).
 *
 * `CLAUDE.md`'s enforcement table may only claim machinery it can show, and
 * `test/enforcement-claims-are-backed.spec.ts` enforces that by requiring every non-discipline row to
 * name an artifact that exists in the checkout. Branch protection and secret scanning are **GitHub
 * settings** — there is no file to point at, which is exactly why that table used to read "not
 * established here — check GitHub, do not infer it".
 *
 * This module is the artifact that resolves it: the table names the command, the command reads the
 * live settings, and a claim that stops being true fails loudly instead of ageing into fiction. Pure —
 * `scripts/check-repo-guards.ts` supplies the two API responses.
 */

/** The shape of `GET /repos/{o}/{r}/branches/{b}/protection`, narrowed to what we assert on. */
export interface ProtectionResponse {
  required_status_checks?: { strict?: boolean; contexts?: string[] };
  enforce_admins?: { enabled?: boolean };
  allow_force_pushes?: { enabled?: boolean };
  allow_deletions?: { enabled?: boolean };
}

/** The `security_and_analysis` block of `GET /repos/{o}/{r}`. */
export interface SecurityResponse {
  secret_scanning?: { status?: string };
  secret_scanning_push_protection?: { status?: string };
  dependabot_security_updates?: { status?: string };
  secret_scanning_non_provider_patterns?: { status?: string };
}

export interface GuardFinding {
  guard: string;
  /** What the setting must be for the enforcement table's claim to be true. */
  expected: string;
  actual: string;
}

/**
 * The required check must be the single summarising job, not the individual ones.
 *
 * Requiring a conditional job by name deadlocks a PR that legitimately skips it: the check never
 * reports, so it sits in "Expected — waiting for status" forever and the branch can never merge. The
 * gate job runs unconditionally and reports for every PR.
 */
export const REQUIRED_CHECK = 'gate';

/** Settings whose absence would make an enforcement-table row a false claim. */
export function findGuardGaps(
  protection: ProtectionResponse | null,
  security: SecurityResponse | null,
): GuardFinding[] {
  const gaps: GuardFinding[] = [];

  if (!protection) {
    gaps.push({
      guard: 'branch protection',
      expected: 'configured on the default branch',
      actual: 'absent (the API answers "Branch not protected")',
    });
  } else {
    const contexts = protection.required_status_checks?.contexts ?? [];
    if (!contexts.includes(REQUIRED_CHECK)) {
      gaps.push({
        guard: 'required status check',
        expected: `contexts include "${REQUIRED_CHECK}"`,
        actual: contexts.length ? contexts.join(', ') : 'none required',
      });
    }
    if (protection.required_status_checks?.strict !== true) {
      gaps.push({
        guard: 'branch up to date before merging',
        expected: 'strict = true',
        actual: String(protection.required_status_checks?.strict),
      });
    }
    if (protection.allow_force_pushes?.enabled !== false) {
      gaps.push({
        guard: 'force push to the default branch',
        expected: 'disabled',
        actual: String(protection.allow_force_pushes?.enabled),
      });
    }
    if (protection.allow_deletions?.enabled !== false) {
      gaps.push({
        guard: 'deletion of the default branch',
        expected: 'disabled',
        actual: String(protection.allow_deletions?.enabled),
      });
    }
  }

  // Public repository: a pushed credential is compromised the moment it lands, and deleting the
  // commit does not undo it. Push protection is the only one of these that acts *before* the push.
  const required: [keyof SecurityResponse, string][] = [
    ['secret_scanning', 'secret scanning'],
    ['secret_scanning_push_protection', 'secret scanning push protection'],
    ['dependabot_security_updates', 'dependabot security updates'],
  ];
  for (const [key, label] of required) {
    const status = security?.[key]?.status;
    if (status !== 'enabled') {
      gaps.push({
        guard: label,
        expected: 'enabled',
        actual: status ?? 'absent from the response',
      });
    }
  }

  return gaps;
}

/**
 * Guards that are deliberately NOT required, so a reader does not mistake their absence for a gap.
 *
 * `enforce_admins` stays off on purpose: with it on, a broken CI cannot be fixed, because the fix
 * would itself have to pass the CI it breaks. The cost is that an administrator can still push to the
 * default branch and override a red merge — that is the documented emergency path, and #283's
 * scheduled audit is what surfaces its use.
 */
export function deliberatelyUnenforced(
  protection: ProtectionResponse | null,
): string[] {
  const notes: string[] = [];
  if (protection?.enforce_admins?.enabled === false) {
    notes.push(
      'enforce_admins is off by choice: administrators may override, which keeps an escape hatch ' +
        'for the case where CI itself is broken. Direct pushes by an admin therefore remain ' +
        'discipline, not mechanism.',
    );
  }
  return notes;
}
