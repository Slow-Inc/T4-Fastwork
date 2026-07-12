import { describe, it, expect } from 'bun:test';
import { buildChatMessages } from '../src/chat/build-messages';

describe('buildChatMessages', () => {
  it('places the system prompt first and the new user message last', () => {
    const msgs = buildChatMessages('SYS', [], 'hello');
    expect(msgs[0]).toEqual({ role: 'system', content: 'SYS' });
    expect(msgs[msgs.length - 1]).toEqual({ role: 'user', content: 'hello' });
  });

  it('includes prior history between system and the new message', () => {
    const history = [
      { role: 'user' as const, content: 'q1' },
      { role: 'assistant' as const, content: 'a1' },
    ];
    const msgs = buildChatMessages('SYS', history, 'q2');
    expect(msgs).toEqual([
      { role: 'system', content: 'SYS' },
      { role: 'user', content: 'q1' },
      { role: 'assistant', content: 'a1' },
      { role: 'user', content: 'q2' },
    ]);
  });

  it('caps history to the most recent maxHistory messages', () => {
    const history = Array.from({ length: 20 }, (_, i) => ({
      role: (i % 2 === 0 ? 'user' : 'assistant') as 'user' | 'assistant',
      content: `m${i}`,
    }));
    const msgs = buildChatMessages('SYS', history, 'new', 6);
    // system + 6 history + new user
    expect(msgs.length).toBe(8);
    expect(msgs[1].content).toBe('m14'); // last 6 → m14..m19
    expect(msgs[6].content).toBe('m19');
  });

  it('drops empty-content history entries', () => {
    const history = [
      { role: 'assistant' as const, content: '' },
      { role: 'user' as const, content: 'real' },
    ];
    const msgs = buildChatMessages('SYS', history, 'x');
    expect(msgs.some((m) => m.content === '')).toBe(false);
    expect(msgs).toContainEqual({ role: 'user', content: 'real' });
  });
});
