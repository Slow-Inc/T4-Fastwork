import { describe, it, expect } from 'bun:test';
import { ScopeSummaryService } from '../src/chat/scope-summary.service';

function fakeLog(history: { role: 'user' | 'assistant'; content: string }[]) {
  return { getRecentHistory: async () => history };
}

describe('ScopeSummaryService.summarize', () => {
  it('short-circuits without calling the LLM when there is no history yet', async () => {
    let called = false;
    const llm = { complete: async () => ((called = true), '') };
    const svc = new ScopeSummaryService(llm as never, fakeLog([]) as never);

    const r = await svc.summarize('session-1');

    expect(called).toBe(false);
    expect(r.hasEnoughInfo).toBe(false);
  });

  it('extracts a summary from the LLM response once there is history', async () => {
    const llm = {
      complete: async () =>
        JSON.stringify({
          hasEnoughInfo: true,
          projectType: 'เว็บอสังหาริมทรัพย์',
          budgetRange: '15,000–60,000 บาท',
          timeline: 'ประเมินหลังสรุปขอบเขตงาน',
          notes: null,
        }),
    };
    const log = fakeLog([
      { role: 'user', content: 'อยากได้เว็บอสังหา งบเท่าไหร่ดี' },
      { role: 'assistant', content: 'แนะนำเคสงานอสังหาริมทรัพย์ครับ' },
    ]);
    const svc = new ScopeSummaryService(llm as never, log as never);

    const r = await svc.summarize('session-2');

    expect(r.hasEnoughInfo).toBe(true);
    expect(r.projectType).toBe('เว็บอสังหาริมทรัพย์');
  });

  it('degrades to hasEnoughInfo: false when the LLM call throws', async () => {
    const llm = {
      complete: async () => {
        throw new Error('gateway down');
      },
    };
    const log = fakeLog([{ role: 'user', content: 'อยากได้เว็บอสังหา' }]);
    const svc = new ScopeSummaryService(llm as never, log as never);

    const r = await svc.summarize('session-3');

    expect(r.hasEnoughInfo).toBe(false);
  });
});
