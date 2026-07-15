/**
 * Sync the admin allowlist (Epic C / C4) from the ADMIN_EMAILS env into the
 * `app_admins` table, which `is_app_admin()` (SECURITY DEFINER) checks against the
 * JWT email claim to gate admin-only RPCs (e.g. approving member certificates).
 * Keeps env as the source of truth; re-run on deploy when ADMIN_EMAILS changes.
 * Idempotent (on conflict do nothing). Run from a context where ADMIN_EMAILS and
 * DATABASE_URL are both set, e.g.:
 *   ADMIN_EMAILS="$(grep '^ADMIN_EMAILS=' ../nextjs/.env.local | cut -d= -f2-)" \
 *     bun src/database/seed-app-admins.ts
 */
import postgres from 'postgres';

async function main() {
  const emails = (process.env.ADMIN_EMAILS ?? '')
    .split(',')
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
  if (emails.length === 0) {
    console.log('ADMIN_EMAILS is empty — nothing to seed');
    return;
  }
  const sql = postgres(process.env.DATABASE_URL!, { prepare: false });
  for (const email of emails) {
    await sql`insert into app_admins (email) values (${email}) on conflict do nothing`;
  }
  console.log(`synced ${emails.length} admin email(s) into app_admins`);
  await sql.end();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
