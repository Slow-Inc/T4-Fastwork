import { test, expect, describe } from 'bun:test';
import { appendToken, appendCard, type MessagePart } from './chat-message';

describe('appendToken', () => {
  test('starts a text part when empty', () => {
    expect(appendToken([], 'hi')).toEqual([{ type: 'text', text: 'hi' }]);
  });

  test('merges consecutive tokens into the trailing text part', () => {
    const a = appendToken([], 'ทีม ');
    const b = appendToken(a, 'T4');
    expect(b).toEqual([{ type: 'text', text: 'ทีม T4' }]);
  });

  test('starts a new text part after a card', () => {
    const parts: MessagePart[] = [
      { type: 'text', text: 'ดูงานนี้ ' },
      { type: 'card', card: { kind: 'project', slug: 'mangadock' } },
    ];
    const next = appendToken(parts, ' ครับ');
    expect(next.length).toBe(3);
    expect(next[2]).toEqual({ type: 'text', text: ' ครับ' });
  });

  test('does not mutate the input array', () => {
    const parts: MessagePart[] = [{ type: 'text', text: 'a' }];
    appendToken(parts, 'b');
    expect(parts).toEqual([{ type: 'text', text: 'a' }]);
  });
});

describe('appendCard', () => {
  test('pushes a card part at the current position', () => {
    const parts: MessagePart[] = [{ type: 'text', text: 'x ' }];
    const next = appendCard(parts, { kind: 'service', id: '4' });
    expect(next[1]).toEqual({ type: 'card', card: { kind: 'service', id: '4' } });
  });
});
