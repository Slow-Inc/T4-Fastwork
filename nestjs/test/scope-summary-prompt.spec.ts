import { describe, it, expect } from 'bun:test';
import { buildScopeSummaryMessages } from '../src/chat/scope-summary-prompt';

describe('buildScopeSummaryMessages', () => {
  it('puts a system instruction first, asking for JSON with the expected fields', () => {
    const msgs = buildScopeSummaryMessages([
      { role: 'user', content: 'อยากได้เว็บอสังหา' },
      { role: 'assistant', content: 'แนะนำเคสงานอสังหาริมทรัพย์ครับ' },
    ]);
    expect(msgs[0].role).toBe('system');
    expect(msgs[0].content).toContain('hasEnoughInfo');
    expect(msgs[0].content).toContain('projectType');
    expect(msgs[0].content).toContain('budgetRange');
    expect(msgs[0].content).toContain('timeline');
  });

  it('includes the conversation history verbatim after the system message', () => {
    const history = [
      { role: 'user' as const, content: 'อยากได้เว็บอสังหา' },
      { role: 'assistant' as const, content: 'แนะนำเคสงานอสังหาริมทรัพย์ครับ' },
    ];
    const msgs = buildScopeSummaryMessages(history);
    expect(msgs.slice(1)).toEqual(history);
  });

  it('returns just the system message when history is empty', () => {
    const msgs = buildScopeSummaryMessages([]);
    expect(msgs).toHaveLength(1);
    expect(msgs[0].role).toBe('system');
  });
});
