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
  reconcileMemberProjects,
  type MemberProjectStore,
} from './github-member-sync';
import type { SnapshotReadPort } from './github-curate-run';

export const MEMBER_PROJECT_STORE = Symbol('MEMBER_PROJECT_STORE');
export const MEMBER_SNAPSHOT_READER = Symbol('MEMBER_SNAPSHOT_READER');

/**
 * Admin/cron trigger to sync every member's PUBLIC repos into member_projects (SECURITY
 * BOUNDARY, spec B4). Same `x-refresh-secret` / `GITHUB_REFRESH_SECRET` scheme (constant-
 * time, fail-closed). **Dry-run by default** — reports the repo count per member WITHOUT
 * writing; `apply: true` upserts (idempotent, preserves the admin's `selected` picks).
 */
@Controller('github')
export class GithubMemberSyncController {
  constructor(
    @Inject(MEMBER_PROJECT_STORE) private readonly store: MemberProjectStore,
    @Inject(MEMBER_SNAPSHOT_READER)
    private readonly snapshots: SnapshotReadPort,
  ) {}

  @Post('sync-member-projects')
  async sync(
    @Headers('x-refresh-secret') secret: string | undefined,
    @Body() body: { apply?: boolean } | undefined,
  ): Promise<{
    total: number;
    perMember: { login: string; repos: number }[];
    applied: boolean;
  }> {
    const expected = process.env.GITHUB_REFRESH_SECRET;
    if (!expected || !constantTimeEqual(secret, expected)) {
      throw new UnauthorizedException();
    }
    const apply = Boolean(body?.apply);
    const members = await this.store.getMembersWithLogin();
    const res = await reconcileMemberProjects(
      members,
      this.snapshots,
      this.store,
      apply,
    );
    return { total: res.total, perMember: res.perMember, applied: apply };
  }
}
