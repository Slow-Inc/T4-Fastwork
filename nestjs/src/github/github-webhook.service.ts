/**
 * Webhook processing (ADR 0003, spec P3 — security boundary). Verifies the
 * HMAC signature over the raw body, deduplicates by `X-GitHub-Delivery`, then
 * refreshes the affected owner and (S7) feeds the per-repo automation pipeline.
 */
import { verifyGithubSignature } from './webhook-verify';
import type { SyncEvent } from './project-automation-sync';

export interface DeliveryDedup {
  /** true if this delivery id was already processed (idempotency). */
  seenBefore(deliveryId: string): Promise<boolean>;
}

export interface OwnerRefresher {
  /** Re-sync the repo lists for one account/org (the changed owner). */
  refreshOwner(owner: string): Promise<void>;
}

/** Optional per-repo pipeline after owner refresh (#192). */
export interface PushPipelineRunner {
  runPush(event: SyncEvent): Promise<unknown>;
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
    private readonly pipeline?: PushPipelineRunner,
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

    const parsed = this.parsePush(rawBody);
    if (!parsed?.owner) return { code: 200, action: 'ignored' };

    await this.refresher.refreshOwner(parsed.owner);

    if (this.pipeline && parsed.repo) {
      const event: SyncEvent = {
        kind: 'github_push',
        owner: parsed.owner,
        repo: parsed.repo,
        headSha: parsed.headSha,
        isDefaultBranch: parsed.isDefaultBranch,
      };
      await this.pipeline.runPush(event);
      return {
        code: 202,
        action: `pipeline:${parsed.owner}/${parsed.repo}`,
      };
    }

    return { code: 202, action: `refreshed:${parsed.owner}` };
  }

  private parsePush(rawBody: string):
    | {
        owner: string;
        repo?: string;
        headSha?: string;
        isDefaultBranch?: boolean;
      }
    | undefined {
    try {
      const payload = JSON.parse(rawBody) as {
        after?: string;
        ref?: string;
        repository?: {
          name?: string;
          default_branch?: string;
          owner?: { login?: string };
        };
      };
      const owner = payload.repository?.owner?.login;
      if (!owner) return undefined;
      const repo = payload.repository?.name;
      const defaultBranch = payload.repository?.default_branch;
      const ref = payload.ref;
      let isDefaultBranch: boolean | undefined;
      if (typeof ref === 'string' && typeof defaultBranch === 'string') {
        isDefaultBranch = ref === `refs/heads/${defaultBranch}`;
      }
      return {
        owner,
        repo: typeof repo === 'string' ? repo : undefined,
        headSha: typeof payload.after === 'string' ? payload.after : undefined,
        isDefaultBranch,
      };
    } catch {
      return undefined;
    }
  }
}
