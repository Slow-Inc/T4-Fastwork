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
  ProjectOverviewService,
  type OverviewLlm,
  type OverviewReadmeReader,
  type OverviewStore,
} from './project-overview.service';

export const OVERVIEW_README = Symbol('OVERVIEW_README');
export const OVERVIEW_LLM = Symbol('OVERVIEW_LLM');
export const OVERVIEW_STORE = Symbol('OVERVIEW_STORE');

/**
 * Admin/cron trigger for D3 structured project overview cards (#130).
 * Secret-guarded; dry-run by default; `apply: true` persists.
 */
@Controller('github')
export class ProjectOverviewController {
  private readonly logger = new Logger(ProjectOverviewController.name);

  constructor(
    @Inject(OVERVIEW_README) private readonly readme: OverviewReadmeReader,
    @Inject(OVERVIEW_LLM) private readonly llm: OverviewLlm,
    @Inject(OVERVIEW_STORE) private readonly store: OverviewStore,
    @Optional()
    @Inject(RevalidateService)
    private readonly revalidate?: RevalidateService,
  ) {}

  @Post('generate-overviews')
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
    const configured = Number(process.env.OVERVIEW_MAX_PER_RUN);
    const maxPerRun =
      Number.isFinite(configured) && configured >= 1
        ? Math.floor(configured)
        : 1;

    const projects = await this.store.listPublishedGithubProjects();
    const store: OverviewStore = apply
      ? this.store
      : {
          listPublishedGithubProjects: () =>
            this.store.listPublishedGithubProjects(),
          applyOverview: async () => {},
        };
    const svc = new ProjectOverviewService(this.readme, this.llm, store);

    let generated = 0;
    let attempted = 0;
    for (const p of projects) {
      if (attempted >= maxPerRun) break;
      try {
        const r = await svc.generateForProject(p);
        if (r.generated) {
          generated++;
          attempted++;
        }
      } catch (err) {
        this.logger.error(
          `overview generation failed for ${p.slug}: ${
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
      candidates: projects.length,
      attempted,
      generated,
      applied: apply,
      capped: attempted >= maxPerRun,
    };
  }
}
