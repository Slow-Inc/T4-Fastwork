/**
 * Idempotent setup for the Vercel deploy webhook (#218). Pure — the HTTP calls live in the script.
 *
 * Creating this webhook is currently a dashboard click plus a hand-pasted secret, which the North
 * Star treats as a defect to design out. Shapes here follow the Vercel REST docs:
 *
 * - `GET /v1/webhooks` · `POST /v1/webhooks` · `DELETE /v1/webhooks/{id}` — **there is no PATCH**,
 *   so changing an existing webhook means delete-then-create, which rotates its secret. That is why
 *   `planWebhookSetup` only replaces when it must.
 * - `POST /v10/projects/{idOrName}/env?upsert=true` for storing the secret.
 *
 * One correction to #218's plan: **Vercel generates the secret** and returns it from the create
 * call, so the script does not invent one — it stores what the API hands back.
 */

export interface WebhookSpec {
  url: string;
  events: string[];
  projectIds: string[];
}

export interface ExistingWebhook {
  id: string;
  url: string;
  events: string[];
  projectIds?: string[];
}

export type SetupPlan =
  | { action: 'create' }
  | { action: 'unchanged'; id: string }
  | { action: 'replace'; id: string; reason: string };

/** A trailing slash is the same endpoint; treating it as different would create a duplicate hook. */
function sameUrl(a: string, b: string): boolean {
  const norm = (u: string) => u.trim().replace(/\/+$/, '');
  return norm(a) === norm(b);
}

/**
 * What a run should do, given what Vercel already has.
 *
 * Coverage, not equality: an existing hook subscribed to *more* events than we need is fine, and
 * replacing it would rotate the secret — and therefore break the running backend — for no reason.
 * The project scope is compared as a set the hook must cover, so adding a project is real drift.
 */
export function planWebhookSetup(
  existing: readonly ExistingWebhook[],
  desired: WebhookSpec,
): SetupPlan {
  const match = existing.find((w) => sameUrl(w.url, desired.url));
  if (!match) return { action: 'create' };

  const missingEvents = desired.events.filter((e) => !match.events.includes(e));
  if (missingEvents.length) {
    return {
      action: 'replace',
      id: match.id,
      reason: `missing event(s): ${missingEvents.join(', ')} (the webhooks API has no update, so this is a delete + create and the secret rotates)`,
    };
  }

  const covered = new Set(match.projectIds ?? []);
  const missingProjects = desired.projectIds.filter((p) => !covered.has(p));
  if (missingProjects.length) {
    return {
      action: 'replace',
      id: match.id,
      reason: `webhook does not cover project(s): ${missingProjects.join(', ')} (delete + create; the secret rotates)`,
    };
  }

  return { action: 'unchanged', id: match.id };
}

/** Body for `POST /v1/webhooks`. */
export function webhookCreateBody(desired: WebhookSpec): {
  url: string;
  events: string[];
  projectIds: string[];
} {
  return {
    url: desired.url,
    events: [...desired.events],
    projectIds: [...desired.projectIds],
  };
}

/**
 * Body for `POST /v10/projects/{idOrName}/env?upsert=true`.
 *
 * `encrypted` so the value cannot be read back from the dashboard or the API, and **production
 * only** — a preview deployment must not be able to sign requests the backend trusts.
 */
export function envUpsertBody(
  key: string,
  value: string,
): { key: string; value: string; type: 'encrypted'; target: ['production'] } {
  return { key, value, type: 'encrypted', target: ['production'] };
}
