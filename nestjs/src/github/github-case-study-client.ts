/**
 * Binds the pure map-reduce (github-case-study.ts) to a real LLM: turns a
 * `complete(messages)` call into the `mapFile` + `reduce` deps that
 * `runMapReduce` needs. Mirrors `github-generate-client.ts` — the prompts +
 * parsers stay pure/unit-tested; only the network call is injected here, so the
 * whole pipeline is testable with a fake `complete`.
 */
import type { ChatMessage } from '../llm/llm.service';
import {
  buildMapPrompt,
  parseFileExtract,
  buildReducePrompt,
  parseCaseStudy,
  type MapReduceDeps,
} from './github-case-study';

/** The one LLM primitive this adapter needs (matches `LlmService.complete`). */
export type LlmComplete = (messages: ChatMessage[]) => Promise<string>;

/**
 * Produce the `{ mapFile, reduce }` half of `MapReduceDeps` from an LLM
 * `complete` fn. `cachedExtracts` is supplied separately by the caller (it comes
 * from `project_documents`, not the LLM).
 */
export function createCaseStudyLlmClient(
  complete: LlmComplete,
): Pick<MapReduceDeps, 'mapFile' | 'reduce'> {
  return {
    mapFile: async (doc) =>
      parseFileExtract(await complete(buildMapPrompt(doc)), doc),
    reduce: async (extracts, audience, meta) =>
      parseCaseStudy(
        await complete(buildReducePrompt(extracts, audience, meta)),
        audience,
      ),
  };
}
