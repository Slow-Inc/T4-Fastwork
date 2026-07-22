import {
  Body,
  Controller,
  Headers,
  Inject,
  Post,
  UnauthorizedException,
} from '@nestjs/common';
import { constantTimeEqual } from './webhook-verify';
import {
  CaseStudySimpleService,
  type CaseStudySimpleStore,
  type CompletionLlm,
  type ReadmeReader,
} from './case-study-simple';

export const CASE_STUDY_README = Symbol('CASE_STUDY_README');
export const CASE_STUDY_LLM = Symbol('CASE_STUDY_LLM');
export const CASE_STUDY_SIMPLE_STORE = Symbol('CASE_STUDY_SIMPLE_STORE');

/**
 * Admin/cron trigger for the simplified case-study generator (SECURITY BOUNDARY,
 * ADR 0013). Same `x-refresh-secret` / `GITHUB_REFRESH_SECRET` scheme as
 * /github/generate (constant-time, fail-closed).
 *
 * **Dry-run by default** — the delta gate + LLM run so the response reports real
 * would-generate counts, but nothing is written until `apply: true`. The loop is
 * sequential + fail-soft (one bad repo never aborts the batch).
 */
@Controller('github')
export class CaseStudySimpleController {
  constructor(
    @Inject(CASE_STUDY_README) private readonly readme: ReadmeReader,
    @Inject(CASE_STUDY_LLM) private readonly llm: CompletionLlm,
    @Inject(CASE_STUDY_SIMPLE_STORE)
    private readonly store: CaseStudySimpleStore,
  ) {}

  @Post('generate-case-studies')
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

    // Strict boolean — this endpoint writes prod DB only on an EXPLICIT `true`.
    // A truthy-but-not-true body (`"false"`, `1`, a typo) must stay dry-run, never
    // silently persist. (`body` may itself be undefined for a bodyless POST.)
    const apply = body?.apply === true;

    // Bound the LLM calls per invocation so one request stays under the serverless
    // timeout (Vercel maxDuration 60s — an unbounded loop over all candidates timed
    // out with 504). The delta-gate makes the job idempotent + incremental: a
    // generated project bumps `readme_sha` and is skipped next run, so repeated cron
    // runs converge — this cap limits how many are done per run, never which.
    // A malformed env (non-numeric → NaN) must NOT silently disable the cap
    // (`attempted >= NaN` is always false → unbounded); fall back to the default.
    const configured = Number(process.env.CASE_STUDY_MAX_PER_RUN);
    const maxPerRun =
      Number.isFinite(configured) && configured >= 1
        ? Math.floor(configured)
        : 5;

    const projects = await this.store.listPublishedGithubProjects();
    // Dry-run: swap in a store whose publishCaseStudy is a no-op so the pure
    // service flow (delta gate + LLM) is reused unchanged but writes nothing.
    const store: CaseStudySimpleStore = apply
      ? this.store
      : {
          listPublishedGithubProjects: () =>
            this.store.listPublishedGithubProjects(),
          publishCaseStudy: async () => {},
        };
    const svc = new CaseStudySimpleService(this.readme, this.llm, store);

    // Passing the delta gate ⇒ exactly one of (generated:true) or a throw, so
    // counting both as "attempted" bounds the LLM calls precisely; a `generated:false`
    // return is a cheap no-LLM skip (unchanged/absent README, no gh) and keeps
    // scanning without spending the per-run budget.
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
      } catch {
        // Fail-soft per project — a bad repo/LLM reply never aborts the batch, but
        // it did consume an LLM call, so it counts against the per-run budget.
        attempted++;
      }
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
