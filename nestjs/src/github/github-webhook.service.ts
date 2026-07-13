/**
 * Webhook processing (ADR 0003, spec P3 — security boundary). Verifies the
 * HMAC signature over the raw body, deduplicates by `X-GitHub-Delivery`, then
 * refreshes only the affected repo owner. Pure/testable: crypto + injected
 * dedup + refresher. The controller passes the raw body and headers through.
 */
import { verifyGithubSignature } from './webhook-verify';

export interface DeliveryDedup {
  /** true if this delivery id was already processed (idempotency). */
  seenBefore(deliveryId: string): Promise<boolean>;
}

export interface OwnerRefresher {
  /** Re-sync the repo lists for one account/org (the changed owner). */
  refreshOwner(owner: string): Promise<void>;
}

export interface WebhookOutcome {
  code: number;
  action: string;
}

export class GithubWebhookService {
  constructor(
    private readonly secret: string,
    private readonly dedup: DeliveryDedup,
    private readonly refresher: OwnerRefresher,
  ) {}

  async handle(
    rawBody: string,
    signature: string | null | undefined,
    deliveryId: string | null | undefined,
  ): Promise<WebhookOutcome> {
    // Fail closed: with no secret configured, HMAC over an empty key would be
    // forgeable — reject every delivery instead of accepting a forged one.
    if (!this.secret) return { code: 503, action: 'not-configured' };
    if (!verifyGithubSignature(rawBody, signature, this.secret)) {
      return { code: 401, action: 'invalid-signature' };
    }
    if (!deliveryId) return { code: 400, action: 'missing-delivery' };
    if (await this.dedup.seenBefore(deliveryId)) {
      return { code: 200, action: 'duplicate' };
    }

    const owner = this.ownerOf(rawBody);
    if (!owner) return { code: 200, action: 'ignored' };

    await this.refresher.refreshOwner(owner);
    return { code: 202, action: `refreshed:${owner}` };
  }

  private ownerOf(rawBody: string): string | undefined {
    try {
      const payload = JSON.parse(rawBody) as {
        repository?: { owner?: { login?: string } };
      };
      return payload.repository?.owner?.login;
    } catch {
      return undefined;
    }
  }
}
