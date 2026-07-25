/**
 * Create (or verify) the Vercel deploy webhook from a committed script instead of the dashboard.
 * #218 — the configuration becomes reviewable in git and re-runnable, rather than living only as a
 * click somebody made once.
 *
 * The decision logic is in `src/github/vercel-webhook-setup.ts` and is unit-tested; this file is the
 * thin I/O wrapper.
 *
 *   bun run scripts/setup-vercel-webhook.ts              # dry-run: shows the plan, changes nothing
 *   bun run scripts/setup-vercel-webhook.ts --apply      # performs it
 *
 * Environment (the token is a SETUP-time credential — keep it in your shell, not in a repo .env):
 *   VERCEL_TOKEN         required. https://vercel.com/account/tokens
 *   VERCEL_TEAM_ID       optional. Required when the projects live under a team.
 *   VERCEL_BACKEND_PROJECT_ID   required. Receives VERCEL_WEBHOOK_SECRET.
 *   VERCEL_PROJECT_IDS   optional. Comma-separated; defaults to the backend project alone.
 *   WEBHOOK_URL          optional. Defaults to the production backend endpoint.
 *
 * Applying this is an outward-facing change to production infrastructure, so `--apply` needs
 * explicit approval even though the script exists (#218's own constraint).
 */
import {
  envUpsertBody,
  planWebhookSetup,
  webhookCreateBody,
  type ExistingWebhook,
  type WebhookSpec,
} from '../src/github/vercel-webhook-setup';

const API = 'https://api.vercel.com';
const DEFAULT_URL = 'https://t4-fastwork-nestjs.vercel.app/vercel/webhook';
/** The endpoint only acts on a succeeded production deployment (`vercel-webhook.controller.ts`). */
const EVENTS = ['deployment.succeeded'];

function required(name: string): string {
  const v = process.env[name];
  if (!v) {
    console.error(`missing ${name} — see the header of this file`);
    process.exit(1);
  }
  return v;
}

function teamQuery(): string {
  const team = process.env.VERCEL_TEAM_ID;
  return team ? `?teamId=${encodeURIComponent(team)}` : '';
}

async function api(
  path: string,
  token: string,
  init?: { method?: string; body?: unknown },
): Promise<unknown> {
  const res = await fetch(`${API}${path}`, {
    method: init?.method ?? 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: init?.body ? JSON.stringify(init.body) : undefined,
  });
  const text = await res.text();
  if (!res.ok) {
    // The body can echo request context; it never contains our token, and the webhook secret only
    // appears in a SUCCESSFUL create response, which is never printed.
    throw new Error(
      `${init?.method ?? 'GET'} ${path} -> ${res.status}: ${text.slice(0, 300)}`,
    );
  }
  return text ? (JSON.parse(text) as unknown) : null;
}

async function main(): Promise<void> {
  const apply = process.argv.includes('--apply');
  const token = required('VERCEL_TOKEN');
  const backendProjectId = required('VERCEL_BACKEND_PROJECT_ID');
  const projectIds = (process.env.VERCEL_PROJECT_IDS ?? backendProjectId)
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);

  const desired: WebhookSpec = {
    url: process.env.WEBHOOK_URL ?? DEFAULT_URL,
    events: EVENTS,
    projectIds,
  };

  const listed = (await api(`/v1/webhooks${teamQuery()}`, token)) as
    ExistingWebhook[] | { webhooks?: ExistingWebhook[] };
  const existing: ExistingWebhook[] = Array.isArray(listed)
    ? listed
    : (listed?.webhooks ?? []);

  const plan = planWebhookSetup(existing, desired);
  console.log(
    `plan: ${plan.action}${'reason' in plan ? ` — ${plan.reason}` : ''}`,
  );
  console.log(`  url:      ${desired.url}`);
  console.log(`  events:   ${desired.events.join(', ')}`);
  console.log(`  projects: ${desired.projectIds.join(', ')}`);

  if (plan.action === 'unchanged') {
    console.log('nothing to do — the webhook already matches.');
    return;
  }
  if (!apply) {
    console.log('dry-run: re-run with --apply to perform it.');
    return;
  }

  if (plan.action === 'replace') {
    await api(`/v1/webhooks/${plan.id}${teamQuery()}`, token, {
      method: 'DELETE',
    });
    console.log(`deleted ${plan.id} (no update endpoint exists)`);
  }

  const created = (await api(`/v1/webhooks${teamQuery()}`, token, {
    method: 'POST',
    body: webhookCreateBody(desired),
  })) as { id?: string; secret?: string };
  if (!created?.secret) throw new Error('create returned no secret');
  console.log(`created webhook ${created.id ?? '(no id returned)'}`);

  // Vercel generates the secret; it goes straight from the response into the project env and is
  // never printed, written to a file, or committed.
  await api(
    `/v10/projects/${encodeURIComponent(backendProjectId)}/env${teamQuery() ? `${teamQuery()}&upsert=true` : '?upsert=true'}`,
    token,
    {
      method: 'POST',
      body: envUpsertBody('VERCEL_WEBHOOK_SECRET', created.secret),
    },
  );
  console.log(
    'stored VERCEL_WEBHOOK_SECRET (encrypted, production) on the backend project',
  );
  console.log(
    'redeploy the backend so the new value is picked up, then confirm a deploy logs a resolved owner/repo',
  );
}

main().catch((err: unknown) => {
  console.error(err instanceof Error ? err.message : String(err));
  process.exit(1);
});
