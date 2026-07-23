/**
 * Prompt + store orchestration for D4 per-tech "used for" blurbs (#131).
 */
import type { ChatMessage } from '../llm/llm.service';
import {
  filterUsedForPatch,
  parseTechUsedFor,
  type TechUsedFor,
  type UsedForOwner,
} from './tech-used-for';

export interface TechUsedForRow {
  id: number;
  name: string;
  usedFor: string | null;
  usedForOwner: UsedForOwner;
}

export interface TechUsedForStore {
  listTechsNeedingUsedFor(): Promise<TechUsedForRow[]>;
  applyUsedFor(techId: number, blurb: TechUsedFor): Promise<void>;
}

export interface TechUsedForLlm {
  complete(messages: ChatMessage[]): Promise<string>;
}

export function buildUsedForPrompt(input: {
  name: string;
}): ChatMessage[] {
  const system =
    'You write a one-sentence portfolio blurb for a technology chip. ' +
    'Return ONLY one JSON object, no markdown fence. Schema: ' +
    '{"usedFor":string(TH),"usedForEn":string(EN)}. ' +
    'Explain what the technology is typically used for in a software agency portfolio ' +
    '(1 short sentence each language). No marketing fluff.';
  const user = `Technology name: ${input.name}`;
  return [
    { role: 'system', content: system },
    { role: 'user', content: user },
  ];
}

export class TechUsedForService {
  constructor(
    private readonly llm: TechUsedForLlm,
    private readonly store: TechUsedForStore,
  ) {}

  async generateForTech(
    tech: TechUsedForRow,
  ): Promise<{ generated: boolean }> {
    if (tech.usedForOwner !== 'auto') return { generated: false };
    if (tech.usedFor) return { generated: false };

    const blurb = parseTechUsedFor(
      await this.llm.complete(buildUsedForPrompt({ name: tech.name })),
    );
    const safe = filterUsedForPatch(tech.usedForOwner, blurb);
    if (!safe) return { generated: false };
    await this.store.applyUsedFor(tech.id, safe);
    return { generated: true };
  }
}
