/**
 * Refuse a destructive seed against a database nobody said to destroy (#269).
 *
 * `seed.ts`, `seed-members.ts` and `seed-member-content.ts` all open `DATABASE_URL` and delete
 * content tables before inserting. By this repo's env convention `.env` holds the **production**
 * connection string (`.env.local` is the dev one), so the accident is one shell away — and
 * `seed-data.ts` no longer holds what `projects` contains, so the script cannot restore what it
 * removed.
 *
 * Shape of the rule: local is fine unprompted, anything else has to be said out loud. Blocking every
 * remote target outright would be stricter and worse — a Supabase branch is a legitimate thing to
 * seed, and a guard that gets in the way of legitimate work is a guard that gets commented out.
 */

const LOCAL_HOSTS = new Set(['localhost', '127.0.0.1', '::1']);

/** The env var name is part of the contract: the error message has to be able to name it. */
export const SEED_OVERRIDE_ENV = 'SEED_ALLOW_DESTRUCTIVE';

function isExplicitYes(value: string | undefined): boolean {
  if (!value) return false;
  return ['1', 'true', 'yes'].includes(value.trim().toLowerCase());
}

function hostOf(databaseUrl: string): string {
  // `new URL` handles the postgres scheme fine; what it will not do is guess. An unparseable URL
  // must refuse rather than fall through to "not local, so ask for the flag" — the operator needs to
  // know the input was wrong, not that permission was missing.
  let hostname: string;
  try {
    hostname = new URL(databaseUrl).hostname;
  } catch {
    throw new Error(
      'DATABASE_URL could not be parsed as a URL — refusing to run a destructive seed against ' +
        'an unknown target.',
    );
  }
  if (!hostname) {
    throw new Error(
      'DATABASE_URL has no host — refusing to run a destructive seed against an unknown target.',
    );
  }
  // `new URL` keeps the brackets on an IPv6 literal.
  return hostname.replace(/^\[|\]$/g, '');
}

/**
 * Throws unless this database is a safe target for a seed that deletes rows.
 *
 * Pure so the decision is testable without a database: the scripts pass `process.env` in.
 */
export function assertDestructiveSeedAllowed(opts: {
  databaseUrl: string | undefined;
  allow: string | undefined;
}): void {
  if (!opts.databaseUrl) {
    throw new Error(
      'DATABASE_URL is not set — refusing to run a destructive seed.',
    );
  }

  const host = hostOf(opts.databaseUrl);
  if (LOCAL_HOSTS.has(host) || host.endsWith('.local')) return;
  if (isExplicitYes(opts.allow)) return;

  throw new Error(
    `Refusing to run a destructive seed against the non-local host "${host}". This deletes ` +
      `content tables, and by this repo's convention a non-local DATABASE_URL is production. If ` +
      `you really mean this target (a Supabase branch, say), re-run with ` +
      `${SEED_OVERRIDE_ENV}=1.`,
  );
}
