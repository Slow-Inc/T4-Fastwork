/**
 * Public read API for the portfolio (ADR 0003, spec P4). GET-only, no secret —
 * it serves the durable snapshot, never GitHub. The `Cache-Control` header does
 * the "SWR at the edge": Cloudflare/Next serve the cached response instantly and
 * revalidate in the background (a Cloudflare Cache Rule is required so JSON is
 * actually cached). A missing snapshot returns `null` — the frontend falls back
 * to the curated `site.ts` data.
 *
 * The secret-guarded write endpoints (`POST /github/refresh`, `/github/webhook`)
 * are a security boundary and are added under /security-review (#21, #23).
 */
import { Controller, Get, Header, Param } from '@nestjs/common';
import { GithubReadService, type ReadResult } from './github-read.service';
import { GITHUB_MEMBERS, GITHUB_ORG } from './github.config';

const SWR_CACHE = 'public, s-maxage=60, stale-while-revalidate=120';

@Controller('github')
export class GithubController {
  constructor(private readonly read: GithubReadService) {}

  @Get('team')
  @Header('Cache-Control', SWR_CACHE)
  async team(): Promise<{
    org: ReadResult | null;
    members: { login: string; repos: ReadResult | null }[];
  }> {
    const [org, members] = await Promise.all([
      this.read.getOrgRepos(GITHUB_ORG),
      Promise.all(
        GITHUB_MEMBERS.map(async (login) => ({
          login,
          repos: await this.read.getMemberRepos(login),
        })),
      ),
    ]);
    return { org, members };
  }

  @Get('repos/:login')
  @Header('Cache-Control', SWR_CACHE)
  repos(@Param('login') login: string): Promise<ReadResult | null> {
    return this.read.getMemberRepos(login);
  }

  /** Detail for one repo (project detail page, spec P6): contributors + open
   * pulls + README. Each field is `null` when its snapshot is missing. */
  @Get('repos/:owner/:repo/detail')
  @Header('Cache-Control', SWR_CACHE)
  async repoDetail(
    @Param('owner') owner: string,
    @Param('repo') repo: string,
  ): Promise<{
    contributors: ReadResult | null;
    pulls: ReadResult | null;
    readme: ReadResult | null;
  }> {
    const [contributors, pulls, readme] = await Promise.all([
      this.read.getRepoContributors(owner, repo),
      this.read.getRepoPulls(owner, repo),
      this.read.getRepoReadme(owner, repo),
    ]);
    return { contributors, pulls, readme };
  }

  /** A member's profile + profile README (team page, spec P7). */
  @Get('users/:login')
  @Header('Cache-Control', SWR_CACHE)
  async user(@Param('login') login: string): Promise<{
    profile: ReadResult | null;
    readme: ReadResult | null;
  }> {
    const [profile, readme] = await Promise.all([
      this.read.getUserProfile(login),
      this.read.getUserReadme(login),
    ]);
    return { profile, readme };
  }
}
