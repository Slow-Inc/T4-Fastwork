import type { ChatMessage } from '../llm/llm.service';

/** The listing types the ranker orders for display. */
export type RankKind = 'projects' | 'certificates' | 'blog';

/** One item to rank: a stable id + a title + optional scalar signals. */
export interface RankCandidate {
  id: string;
  title: string;
  signals?: Record<string, string | number>;
}

/** One ranked item — an id, optionally with the LLM's one-line rationale. */
export interface RankedItem {
  id: string;
  rationale?: string;
}

/**
 * The ranking rubric. Kept as one constant so the criteria/weights are tunable in
 * one place (a future admin setting can override). `{kind}` is filled per listing.
 */
const RANK_RUBRIC = `You rank a T4 Labs portfolio listing ("{kind}") for public display — strongest evidence of trust first.
Score each item on: impact to customer (a real, valuable outcome) · credibility (issuer prestige + verifiability) · recency · relevance to T4's positioning (SaaS / web / AI product engineering). For blog items, also weigh "views".
Return JSON ONLY (no prose outside it): an array ordered best-first of {"id": string, "rationale": string} — one short rationale per item. Use only the ids given; include every id exactly once.`;

/** Assembles the ranking call's messages — pure, so it's independently testable. */
export function buildRankMessages(
  kind: RankKind,
  candidates: RankCandidate[],
): ChatMessage[] {
  return [
    { role: 'system', content: RANK_RUBRIC.replace('{kind}', kind) },
    { role: 'user', content: JSON.stringify(candidates) },
  ];
}

/** The LLM call, injected so the ranking core stays pure/testable (mirrors the
 *  `LlmClient` seam in `github-generate`). Bind to `LlmService.complete` in wiring. */
export type RankClient = (messages: ChatMessage[]) => Promise<string>;

/**
 * The ranking core: prompt → injected LLM → parse. Returns a permutation of the
 * candidate ids (best-first), never dropping one. No candidates → `[]` with no LLM
 * call. Persistence + human-pin precedence live in the store/wiring (B2/B3).
 */
export async function rankCandidates(
  client: RankClient,
  kind: RankKind,
  candidates: RankCandidate[],
): Promise<RankedItem[]> {
  if (candidates.length === 0) return [];
  const raw = await client(buildRankMessages(kind, candidates));
  return parseRanking(
    raw,
    candidates.map((c) => c.id),
  );
}

/** A persistable rank row: `ai_rank` (0-based, lower = higher priority). */
export interface RankRow {
  id: string;
  aiRank: number;
  aiRankRationale?: string;
}

/**
 * Maps a ranked list to persistable rows — position → `ai_rank`. Human pins
 * (a non-zero `sort_order`) win at the READ path (D1), not here; this only
 * records the AI's relative order.
 */
export function ranksToRows(ranked: RankedItem[]): RankRow[] {
  return ranked.map((r, i) =>
    r.rationale
      ? { id: r.id, aiRank: i, aiRankRationale: r.rationale }
      : { id: r.id, aiRank: i },
  );
}

/**
 * Persistence seam for ranking (impls: Drizzle for `projects`, Supabase for
 * `certificates`/`blog_posts`). Kept an interface so the ranking core stays pure;
 * the concrete stores + cron wiring land in B3.
 */
export interface RankStore {
  getCandidates(kind: RankKind): Promise<RankCandidate[]>;
  applyRanks(kind: RankKind, rows: RankRow[]): Promise<void>;
}

/**
 * Parses the LLM's ranking response into an ordered list. Tolerant of markdown
 * fences and malformed output. **Always returns a permutation of `knownIds`** —
 * ids the LLM ordered come first (in its order, deduped, unknown ids dropped),
 * then any `knownIds` it omitted are appended in their original order. So an item
 * is never dropped from the display, and a bad LLM reply degrades to the input
 * order rather than throwing.
 */
export function parseRanking(raw: string, knownIds: string[]): RankedItem[] {
  const known = new Set(knownIds);
  const rationaleById = new Map<string, string>();
  const order: string[] = [];
  const seen = new Set<string>();

  const match = raw.match(/\[[\s\S]*\]/);
  if (match) {
    try {
      const parsed = JSON.parse(match[0]) as unknown;
      if (Array.isArray(parsed)) {
        for (const entry of parsed) {
          const id = (entry as { id?: unknown })?.id;
          if (typeof id !== 'string' || !known.has(id) || seen.has(id))
            continue;
          seen.add(id);
          order.push(id);
          const rationale = (entry as { rationale?: unknown }).rationale;
          if (typeof rationale === 'string' && rationale.trim().length > 0) {
            rationaleById.set(id, rationale);
          }
        }
      }
    } catch {
      // fall through to the input order
    }
  }

  // Append any known ids the LLM omitted, in their original order.
  for (const id of knownIds) if (!seen.has(id)) order.push(id);

  return order.map((id) => {
    const rationale = rationaleById.get(id);
    return rationale ? { id, rationale } : { id };
  });
}
