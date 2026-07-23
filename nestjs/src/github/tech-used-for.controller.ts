import {
  Body,
  Controller,
  Headers,
  Inject,
  Logger,
  Optional,
  Post,
  UnauthorizedException,
} from '@nestjs/common';
import { constantTimeEqual } from './webhook-verify';
import { RevalidateService } from '../revalidate/revalidate.service';
import {
  TechUsedForService,
  type TechUsedForLlm,
  type TechUsedForStore,
} from './tech-used-for.service';

export const TECH_USED_FOR_LLM = Symbol('TECH_USED_FOR_LLM');
export const TECH_USED_FOR_STORE = Symbol('TECH_USED_FOR_STORE');

/**
 * Admin/cron trigger for D4 per-tech "used for" blurbs (#131).
 * Secret-guarded; dry-run by default; `apply: true` persists.
 */
@Controller('github')
export class TechUsedForController {
  private readonly logger = new Logger(TechUsedForController.name);

  constructor(
    @Inject(TECH_USED_FOR_LLM) private readonly llm: TechUsedForLlm,
    @Inject(TECH_USED_FOR_STORE) private readonly store: TechUsedForStore,
    @Optional()
    @Inject(RevalidateService)
    private readonly revalidate?: RevalidateService,
  ) {}

  @Post('generate-tech-used-for')
  async run(
    @Headers('x-refresh-secret') secret: string | undefined,
    @Body() body: { apply?: boolean },
  ): Promise<{
    candidates: number;
    attempted: number;
    generated: number;
    applied: boolean;
    capped: boolean;
  }> {
    const expected = process.env.GITHUB_REFRESH_SECRET;
    if (!expected || !constantTimeEqual(secret, expected)) {
      throw new UnauthorizedException();
    }
    const apply = body?.apply === true;
    const configured = Number(process.env.TECH_USED_FOR_MAX_PER_RUN);
    const maxPerRun =
      Number.isFinite(configured) && configured >= 1
        ? Math.floor(configured)
        : 1;

    const techs = await this.store.listTechsNeedingUsedFor();
    const store: TechUsedForStore = apply
      ? this.store
      : {
          listTechsNeedingUsedFor: () => this.store.listTechsNeedingUsedFor(),
          applyUsedFor: async () => {},
        };
    const svc = new TechUsedForService(this.llm, store);

    let generated = 0;
    let attempted = 0;
    for (const t of techs) {
      if (attempted >= maxPerRun) break;
      if (t.usedForOwner !== 'auto' || t.usedFor) continue;
      try {
        const r = await svc.generateForTech(t);
        if (r.generated) {
          generated++;
          attempted++;
        }
      } catch (err) {
        this.logger.error(
          `tech used-for generation failed for ${t.name}: ${
            err instanceof Error ? err.message : String(err)
          }`,
        );
        attempted++;
      }
    }
    if (apply && generated > 0) {
      void this.revalidate?.revalidateProjects();
    }
    return {
      candidates: techs.filter((t) => t.usedForOwner === 'auto' && !t.usedFor)
        .length,
      attempted,
      generated,
      applied: apply,
      capped: attempted >= maxPerRun,
    };
  }
}
