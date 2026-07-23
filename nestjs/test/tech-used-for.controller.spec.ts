import { describe, it, expect, beforeEach, afterEach } from 'bun:test';
import { UnauthorizedException } from '@nestjs/common';
import { TechUsedForController } from '../src/github/tech-used-for.controller';
import type {
  TechUsedForLlm,
  TechUsedForStore,
} from '../src/github/tech-used-for.service';

const blurbJson = JSON.stringify({
  usedFor: 'ใช้ทำ frontend',
  usedForEn: 'Powers the frontend',
});

function make() {
  const applied: number[] = [];
  const store: TechUsedForStore = {
    listTechsNeedingUsedFor: async () => [
      {
        id: 1,
        name: 'Next.js',
        usedFor: null,
        usedForOwner: 'auto',
      },
    ],
    applyUsedFor: async (id) => {
      applied.push(id);
    },
  };
  const llm: TechUsedForLlm = { complete: async () => blurbJson };
  return {
    c: new TechUsedForController(llm, store),
    applied,
  };
}

describe('TechUsedForController (#131)', () => {
  const prev = process.env.GITHUB_REFRESH_SECRET;
  const prevCap = process.env.TECH_USED_FOR_MAX_PER_RUN;
  beforeEach(() => {
    process.env.GITHUB_REFRESH_SECRET = 'right';
    process.env.TECH_USED_FOR_MAX_PER_RUN = '5';
  });
  afterEach(() => {
    if (prev === undefined) delete process.env.GITHUB_REFRESH_SECRET;
    else process.env.GITHUB_REFRESH_SECRET = prev;
    if (prevCap === undefined) delete process.env.TECH_USED_FOR_MAX_PER_RUN;
    else process.env.TECH_USED_FOR_MAX_PER_RUN = prevCap;
  });

  it('rejects a wrong secret', async () => {
    const { c } = make();
    await expect(c.run('wrong', {})).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
  });

  it('dry-run generates counts but does not persist', async () => {
    const { c, applied } = make();
    const res = await c.run('right', {});
    expect(res.applied).toBe(false);
    expect(res.generated).toBe(1);
    expect(applied).toHaveLength(0);
  });

  it('apply:true persists', async () => {
    const { c, applied } = make();
    const res = await c.run('right', { apply: true });
    expect(res.applied).toBe(true);
    expect(res.generated).toBe(1);
    expect(applied).toEqual([1]);
  });
});
