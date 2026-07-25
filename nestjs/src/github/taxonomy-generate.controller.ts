/**
 * Admin/cron trigger for #159 AI taxonomy backfill.
 * Secret-guarded; dry-run by default; `apply: true` persists; default cap 1.
 */
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
  TaxonomyGenerateService,
  type TaxonomyLlm,
  type TaxonomyReadmeReader,
  type TaxonomyStore,
} from './taxonomy-generate';

export const TAXONOMY_STORE = Symbol('TAXONOMY_STORE');
export const TAXONOMY_README = Symbol('TAXONOMY_README');
export const TAXONOMY_LLM = Symbol('TAXONOMY_LLM');

@Controller('github')
export class TaxonomyGenerateController {
  private readonly logger = new Logger(TaxonomyGenerateController.name);

  constructor(
    @Inject(TAXONOMY_STORE) private readonly store: TaxonomyStore,
    @Inject(TAXONOMY_README) private readonly readme: TaxonomyReadmeReader,
    @Inject(TAXONOMY_LLM) private readonly llm: TaxonomyLlm,
    @Optional()
    @Inject(RevalidateService)
    private readonly revalidate?: RevalidateService,
  ) {}

  @Post('generate-taxonomy')
  async run(
    @Headers('x-refresh-secret') secret: string | undefined,
    @Body() body: { apply?: boolean },
  ): Promise<{
    candidates: number;
    attempted: number;
    generated: number;
    applied: boolean;
    capped: boolean;
    /**
     * Published candidates whose repo has no README at all, so generation can never produce
     * anything for them (#211). They are named rather than counted because the count alone leaves
     * an operator running a manual query to find out which row is stuck — and their skip costs no
     * LLM call, so it never consumes the cap and the run still reports success without them.
     */
    noReadmeSlugs: string[];
  }> {
    const expected = process.env.GITHUB_REFRESH_SECRET;
    if (!expected || !constantTimeEqual(secret, expected)) {
      throw new UnauthorizedException();
    }
    const apply = body?.apply === true;
    const configured = Number(process.env.TAXONOMY_MAX_PER_RUN);
    const maxPerRun =
      Number.isFinite(configured) && configured >= 1
        ? Math.floor(configured)
        : 1;

    const projects = await this.store.listPublishedNeedingTaxonomy();
    const store: TaxonomyStore = apply
      ? this.store
      : {
          listPublishedNeedingTaxonomy: () =>
            this.store.listPublishedNeedingTaxonomy(),
          getContent: (s) => this.store.getContent(s),
          applyPatch: async () => {},
        };
    const svc = new TaxonomyGenerateService(this.readme, this.llm, store);

    let generated = 0;
    let attempted = 0;
    const noReadmeSlugs: string[] = [];
    for (const p of projects) {
      if (attempted >= maxPerRun) break;
      try {
        const r = await svc.generateForProject(p);
        if (r.noReadme) noReadmeSlugs.push(p.slug);
        if (r.generated) {
          generated++;
          attempted++;
        }
      } catch (err) {
        this.logger.error(
          `taxonomy generation failed for ${p.slug}: ${
            err instanceof Error ? err.message : String(err)
          }`,
        );
        attempted++;
      }
    }
    if (apply && generated > 0) {
      void this.revalidate?.revalidateProjects();
    }
    if (noReadmeSlugs.length > 0) {
      // Warn, not error: the run itself succeeded. But a published project that no amount of
      // re-running can fill has to reach the logs on its own — waiting for someone to notice an
      // empty page is the failure mode #211 was found by.
      this.logger.warn(
        `taxonomy: no README on GitHub, cannot generate: ${noReadmeSlugs.join(', ')}`,
      );
    }
    return {
      candidates: projects.length,
      attempted,
      generated,
      applied: apply,
      capped: attempted >= maxPerRun,
      noReadmeSlugs,
    };
  }
}
