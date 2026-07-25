/**
 * The committed, idempotent setup for the Vercel deploy webhook (#218).
 *
 * Shapes verified against the Vercel REST docs, not guessed: `GET/POST /v1/webhooks` +
 * `DELETE /v1/webhooks/{id}` — **there is no PATCH**, so changing a webhook means replace — and
 * `POST /v10/projects/{idOrName}/env?upsert=true` for the secret. Vercel *generates* the secret and
 * returns it from the create call, which corrects the assumption in #218 that the script would
 * generate it.
 */
import { describe, it, expect } from 'bun:test';
import {
  envUpsertBody,
  planWebhookSetup,
  webhookCreateBody,
  type ExistingWebhook,
  type WebhookSpec,
} from '../src/github/vercel-webhook-setup';

const desired: WebhookSpec = {
  url: 'https://t4-fastwork-nestjs.vercel.app/vercel/webhook',
  events: ['deployment.succeeded'],
  projectIds: ['prj_backend', 'prj_frontend'],
};

function existing(over: Partial<ExistingWebhook> = {}): ExistingWebhook {
  return {
    id: 'account_hook_1',
    url: desired.url,
    events: ['deployment.succeeded'],
    projectIds: ['prj_backend', 'prj_frontend'],
    ...over,
  };
}

describe('planWebhookSetup (#218)', () => {
  it('creates when no webhook points at the endpoint yet', () => {
    expect(planWebhookSetup([], desired)).toEqual({ action: 'create' });
  });

  it('does nothing on a second run — the point of committing the script', () => {
    // Re-running must be safe, or nobody will re-run it and the config drifts back to a dashboard.
    expect(planWebhookSetup([existing()], desired)).toEqual({
      action: 'unchanged',
      id: 'account_hook_1',
    });
  });

  it('replaces, not updates, when the events differ — the API has no PATCH', () => {
    const plan = planWebhookSetup(
      [existing({ events: ['deployment.created'] })],
      desired,
    );

    expect(plan.action).toBe('replace');
    expect(plan).toMatchObject({ id: 'account_hook_1' });
    expect((plan as { reason: string }).reason).toMatch(/event/i);
  });

  it('replaces when the project scope differs, so a new project is actually covered', () => {
    const plan = planWebhookSetup(
      [existing({ projectIds: ['prj_backend'] })],
      desired,
    );

    expect(plan.action).toBe('replace');
    expect((plan as { reason: string }).reason).toMatch(/project/i);
  });

  it('ignores a trailing slash, which would otherwise create a duplicate webhook', () => {
    expect(
      planWebhookSetup([existing({ url: `${desired.url}/` })], desired).action,
    ).toBe('unchanged');
  });

  it('ignores webhooks pointing somewhere else entirely', () => {
    expect(
      planWebhookSetup(
        [existing({ url: 'https://example.com/other', id: 'other' })],
        desired,
      ),
    ).toEqual({ action: 'create' });
  });

  it('treats an extra event on the existing hook as fine, not as drift', () => {
    // Someone may have subscribed to more events by hand; the requirement is coverage, not equality,
    // and replacing would rotate the secret for no reason.
    expect(
      planWebhookSetup(
        [existing({ events: ['deployment.succeeded', 'deployment.error'] })],
        desired,
      ).action,
    ).toBe('unchanged');
  });
});

describe('request bodies (#218)', () => {
  it('builds the create body the documented endpoint expects', () => {
    expect(webhookCreateBody(desired)).toEqual({
      url: desired.url,
      events: ['deployment.succeeded'],
      projectIds: ['prj_backend', 'prj_frontend'],
    });
  });

  it('stores the secret encrypted and production-only', () => {
    // `encrypted` so the value is not readable back from the dashboard or the API, and production
    // only because a preview deployment must not be able to sign requests the backend trusts.
    expect(envUpsertBody('VERCEL_WEBHOOK_SECRET', 's3cret')).toEqual({
      key: 'VERCEL_WEBHOOK_SECRET',
      value: 's3cret',
      type: 'encrypted',
      target: ['production'],
    });
  });
});
