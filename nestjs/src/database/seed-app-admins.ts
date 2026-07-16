/**
 * Sync the admin allowlist (Epic C / C4) from the ADMIN_EMAILS env into the
 * `app_admins` table, which `is_app_admin()` (SECURITY DEFINER) checks against the
 * JWT email claim to gate admin-only RPCs + RLS (e.g. approving member certificates,
 * and — since migration 0018 — reading conversations/messages).
 *
 * Env is the source of truth; re-run on deploy when ADMIN_EMAILS changes. This is a
 * full **reconcile**, not an insert-only seed: emails removed from ADMIN_EMAILS are
 * DELETED, so a de-provisioned admin actually loses access. (The old insert-only
 * version left stale rows, so a removed email retained admin — a real escalation once
 * app_admins gates chat-data reads.) Run from a context where ADMIN_EMAILS and
 * DATABASE_URL are both set, e.g.:
 *   ADMIN_EMAILS="$(grep '^ADMIN_EMAILS=' ../nextjs/.env.local | cut -d= -f2-)" \
 *     bun src/database/seed-app-admins.ts
 */
import postgres from 'postgres';
import { parseAdminEmails, reconcileAdmins } from './app-admins-reconcile';

async function main() {
  const emails = parseAdminEmails(process.env.ADMIN_EMAILS);
  if (emails.length === 0) {
    // Refuse to reconcile against an empty set — that would delete every admin and
    // lock out the email-fallback path on a misconfigured deploy. No change.
    console.log(
      'ADMIN_EMAILS is empty — refusing to reconcile (would delete all app_admins). Nothing changed.',
    );
    return;
  }
  const sql = postgres(process.env.DATABASE_URL!, { prepare: false });
  try {
    const rows = await sql<{ email: string }[]>`select email from app_admins`;
    const { toInsert, toDelete } = reconcileAdmins(
      rows.map((r) => r.email),
      emails,
    );
    await sql.begin(async (tx) => {
      for (const email of toInsert) {
        await tx`insert into app_admins (email) values (${email}) on conflict do nothing`;
      }
      if (toDelete.length) {
        await tx`delete from app_admins where lower(email) = any(${toDelete})`;
      }
    });
    console.log(
      `app_admins reconciled: +${toInsert.length} / -${toDelete.length} (now ${emails.length} desired)`,
    );
  } finally {
    await sql.end();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
