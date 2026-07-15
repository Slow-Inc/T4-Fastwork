import { Inject, Injectable, Logger } from '@nestjs/common';
import {
  rankCandidates,
  ranksToRows,
  type RankStore,
  type RankClient,
  type RankKind,
} from './rank';

export const RANK_STORE = Symbol('RANK_STORE');
export const RANK_CLIENT = Symbol('RANK_CLIENT');

/** Every listing kind the ranker maintains. */
export const RANK_KINDS: RankKind[] = ['projects', 'certificates', 'blog'];

/**
 * Computes + persists the AI display-rank for a listing kind. Orchestration only —
 * the LLM call and the store are injected so the logic stays testable. Graceful by
 * design: any failure (LLM/parse/store) logs and leaves the existing ranks
 * untouched, so a flaky gateway never wipes a good order (D2). Human pins win at
 * the read path (D1), not here.
 */
@Injectable()
export class RankService {
  private readonly logger = new Logger(RankService.name);

  constructor(
    @Inject(RANK_STORE) private readonly store: RankStore,
    @Inject(RANK_CLIENT) private readonly client: RankClient,
  ) {}

  async refresh(kind: RankKind): Promise<void> {
    try {
      const candidates = await this.store.getCandidates(kind);
      if (candidates.length === 0) return;
      const ranked = await rankCandidates(this.client, kind, candidates);
      await this.store.applyRanks(kind, ranksToRows(ranked));
    } catch (err) {
      this.logger.warn(`rank refresh failed for ${kind}: ${String(err)}`);
    }
  }

  async refreshAll(): Promise<void> {
    for (const kind of RANK_KINDS) await this.refresh(kind);
  }
}
