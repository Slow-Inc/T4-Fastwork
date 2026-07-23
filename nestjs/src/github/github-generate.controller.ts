import {
  BadRequestException,
  Body,
  Controller,
  Headers,
  Inject,
  Post,
  UnauthorizedException,
} from '@nestjs/common';
import { constantTimeEqual } from './webhook-verify';
import {
  ContentGenerateService,
  filterReviewedPatch,
  type ContentPatch,
  type GenerateContext,
  type GenerateStore,
  type LlmClient,
} from './github-generate';

export const GENERATE_STORE = Symbol('GENERATE_STORE');
export const GENERATE_CLIENT = Symbol('GENERATE_CLIENT');

/**
 * Admin/cron trigger for autonomous content generation (SECURITY BOUNDARY, spec
 * P3). Same `x-refresh-secret` / `GITHUB_REFRESH_SECRET` scheme as /rank/refresh
 * (constant-time, fail-closed).
 *
 * **Dry-run by default** — returns the reconciled patch WITHOUT writing, so an admin
 * reviews the generated copy before it lands. `apply: true` + the reviewed `patch`
 * persists without a second LLM call (#75). Context (README/languages) is supplied
 * in the body for dry-run; auto-assembly from stored snapshots is a follow-up.
 */
@Controller('github')
export class GithubGenerateController {
  constructor(
    @Inject(GENERATE_STORE) private readonly store: GenerateStore,
    @Inject(GENERATE_CLIENT) private readonly llm: LlmClient,
  ) {}

  @Post('generate')
  async generate(
    @Headers('x-refresh-secret') secret: string | undefined,
    @Body()
    body: {
      slug: string;
      context: GenerateContext;
      apply?: boolean;
      /** Required when `apply: true` — the dry-run patch the admin reviewed. */
      patch?: ContentPatch;
    },
  ): Promise<{
    generated: boolean;
    applied: boolean;
    patch?: ContentPatch | null;
  }> {
    const expected = process.env.GITHUB_REFRESH_SECRET;
    if (!expected || !constantTimeEqual(secret, expected)) {
      throw new UnauthorizedException();
    }

    if (body.apply === true) {
      if (!body.patch || typeof body.patch !== 'object') {
        throw new BadRequestException(
          'apply:true requires the reviewed dry-run patch',
        );
      }
      const current = await this.store.getContent(body.slug);
      if (!current) {
        return { generated: false, applied: false };
      }
      const safe = filterReviewedPatch(current, body.patch);
      if (!safe.generatedAt) safe.generatedAt = new Date();
      await this.store.applyPatch(body.slug, safe);
      return { generated: false, applied: true };
    }

    // Dry-run: capture the patch instead of writing.
    let captured: ContentPatch | null = null;
    const store: GenerateStore = {
      getContent: (s) => this.store.getContent(s),
      applyPatch: async (_s, patch) => {
        captured = patch;
      },
    };

    const svc = new ContentGenerateService(store, this.llm);
    const res = await svc.generateForRepo(body.slug, body.context);
    return {
      generated: res.generated,
      applied: false,
      patch: captured,
    };
  }
}
