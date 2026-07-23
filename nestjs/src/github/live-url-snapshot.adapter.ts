import { Inject, Injectable } from '@nestjs/common';
import { GITHUB_MEMBERS, GITHUB_ORG } from './github.config';
import { GithubReadService } from './github-read.service';
import type { LiveUrlSnapshotReader } from './live-url-fill';

/**
 * Reads org + member repo-list snapshots so fill-live-urls can resolve homepage.
 */
@Injectable()
export class LiveUrlSnapshotAdapter implements LiveUrlSnapshotReader {
  constructor(
    @Inject(GithubReadService) private readonly read: GithubReadService,
  ) {}

  async readRepoLists(): Promise<unknown[]> {
    const lists: unknown[] = [];
    const org = await this.read.getOrgRepos(GITHUB_ORG);
    if (org && Array.isArray(org.data)) lists.push(org.data);
    for (const login of GITHUB_MEMBERS) {
      const member = await this.read.getMemberRepos(login);
      if (member && Array.isArray(member.data)) lists.push(member.data);
    }
    return lists;
  }
}
