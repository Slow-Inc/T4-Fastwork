import { describe, it, expect } from 'bun:test';
import { loadChat, saveChat, type PersistedChat } from './chat-persist';

/** Minimal in-memory Storage stand-in. */
function fakeStorage(seed: Record<string, string> = {}): Storage {
  const map = new Map(Object.entries(seed));
  return {
    getItem: (k) => map.get(k) ?? null,
    setItem: (k, v) => void map.set(k, v),
    removeItem: (k) => void map.delete(k),
    clear: () => map.clear(),
    key: (i) => [...map.keys()][i] ?? null,
    get length() {
      return map.size;
    },
  } as Storage;
}

describe('chat-persist', () => {
  it('round-trips a conversation through storage', () => {
    const s = fakeStorage();
    const data: PersistedChat = {
      messages: [{ role: 'user', parts: [] }],
      sessionId: 'sess-1',
    };
    saveChat(s, 'floating', data);
    expect(loadChat(s, 'floating')).toEqual(data);
  });

  it('returns null when nothing is stored', () => {
    expect(loadChat(fakeStorage(), 'floating')).toBeNull();
  });

  it('returns null for an empty conversation (nothing worth restoring)', () => {
    const s = fakeStorage({ floating: JSON.stringify({ messages: [], sessionId: 'x' }) });
    expect(loadChat(s, 'floating')).toBeNull();
  });

  it('is tolerant of corrupt JSON', () => {
    const s = fakeStorage({ floating: '{not json' });
    expect(loadChat(s, 'floating')).toBeNull();
  });

  it('no-ops without a storage (SSR)', () => {
    expect(loadChat(undefined, 'floating')).toBeNull();
    expect(() => saveChat(undefined, 'floating', { messages: [{}], sessionId: 'x' })).not.toThrow();
  });
});
