import { describe, it, expect } from 'bun:test';
import {
  TechUsedForService,
  type TechUsedForLlm,
  type TechUsedForRow,
  type TechUsedForStore,
} from '../src/github/tech-used-for.service';

const blurbJson = JSON.stringify({
  usedFor: 'ใช้ทำ frontend',
  usedForEn: 'Powers the frontend',
});

function make(over: { tech?: Partial<TechUsedForRow> } = {}) {
  const applied: unknown[] = [];
  const tech: TechUsedForRow = {
    id: 1,
    name: 'Next.js',
    usedFor: null,
    usedForOwner: 'auto',
    ...over.tech,
  };
  let llmCalls = 0;
  const llm: TechUsedForLlm = {
    complete: async () => {
      llmCalls++;
      return blurbJson;
    },
  };
  const store: TechUsedForStore = {
    listTechsNeedingUsedFor: async () => [tech],
    applyUsedFor: async (id, b) => {
      applied.push({ id, b });
    },
  };
  return {
    svc: new TechUsedForService(llm, store),
    tech,
    applied,
    llmCalls: () => llmCalls,
  };
}

describe('TechUsedForService generateForTech (#131)', () => {
  it('persists a blurb for an empty auto-owned tech', async () => {
    const { svc, tech, applied, llmCalls } = make();
    const r = await svc.generateForTech(tech);
    expect(r.generated).toBe(true);
    expect(llmCalls()).toBe(1);
    expect(applied).toHaveLength(1);
  });

  it('skips when used_for already exists', async () => {
    const { svc, tech, llmCalls } = make({
      tech: { usedFor: 'already' },
    });
    await expect(svc.generateForTech(tech)).resolves.toEqual({
      generated: false,
    });
    expect(llmCalls()).toBe(0);
  });

  it('skips when used_for_owner is human', async () => {
    const { svc, tech, llmCalls } = make({
      tech: { usedForOwner: 'human' },
    });
    await expect(svc.generateForTech(tech)).resolves.toEqual({
      generated: false,
    });
    expect(llmCalls()).toBe(0);
  });
});
