import { describe, it, expect } from 'bun:test';
import { ChatService } from '../src/chat/chat.service';
import type { ChatEvent } from '../src/chat/chat.types';

// Fakes: no network, no DB. The LLM yields text with a marker split across
// deltas; retrieval returns nothing (its output only feeds the system prompt).
const fakeLlm = {
  // eslint-disable-next-line require-yield
  async *streamChat() {
    yield { kind: 'content', value: 'สวัสดี ' };
    yield { kind: 'content', value: '[PROJECT:fin-' };
    yield { kind: 'content', value: 'track] ครับ' };
  },
};
const emptyRetrieval = { retrieve: async () => [] };

function fakeLog() {
  const calls: unknown[] = [];
  return { calls, logTurn: async (input: unknown) => void calls.push(input) };
}

async function collect(gen: AsyncIterable<ChatEvent>): Promise<ChatEvent[]> {
  const out: ChatEvent[] = [];
  for await (const e of gen) out.push(e);
  return out;
}

function fakeProjectContext(record: unknown = null) {
  const calls: string[] = [];
  return {
    calls,
    getBySlug: async (slug: string) => {
      calls.push(slug);
      return record;
    },
  };
}

describe('ChatService.streamChat', () => {
  it('emits session first, tokens + card in order, then done', async () => {
    const svc = new ChatService(
      fakeLlm as never,
      emptyRetrieval as never,
      fakeLog() as never,
      fakeProjectContext() as never,
    );
    const events = await collect(
      svc.streamChat({ message: 'hi', language: 'th' }),
    );

    expect(events[0]?.type).toBe('session');
    expect(events.at(-1)?.type).toBe('done');

    const text = events
      .filter((e): e is Extract<ChatEvent, { type: 'token' }> => e.type === 'token')
      .map((e) => e.text)
      .join('');
    expect(text).toBe('สวัสดี  ครับ'); // marker stripped

    const cards = events.filter(
      (e): e is Extract<ChatEvent, { type: 'card' }> => e.type === 'card',
    );
    expect(cards).toHaveLength(1);
    expect(cards[0]!.card).toEqual({ kind: 'project', slug: 'fin-track' });
  });

  it('emits reasoning events, strips the leading blank line, and reports reasoningMs', async () => {
    // Mirrors the real gateway: reasoning_content first, then content that starts
    // with "\n\n" (the source of the blank-first-line bug).
    const thinkingLlm = {
      async *streamChat() {
        yield { kind: 'reasoning', value: 'Let me' };
        yield { kind: 'reasoning', value: ' think.' };
        yield { kind: 'content', value: '\n\n' };
        yield { kind: 'content', value: 'สวัสดี' };
        yield { kind: 'content', value: 'ครับ' };
      },
    };
    const svc = new ChatService(
      thinkingLlm as never,
      emptyRetrieval as never,
      fakeLog() as never,
      fakeProjectContext() as never,
    );
    const events = await collect(svc.streamChat({ message: 'hi', language: 'th' }));

    const reasoning = events
      .filter((e): e is Extract<ChatEvent, { type: 'reasoning' }> => e.type === 'reasoning')
      .map((e) => e.text)
      .join('');
    expect(reasoning).toBe('Let me think.');

    const answer = events
      .filter((e): e is Extract<ChatEvent, { type: 'token' }> => e.type === 'token')
      .map((e) => e.text)
      .join('');
    expect(answer).toBe('สวัสดีครับ'); // no leading blank line

    // no token is emitted for the whitespace-only "\n\n" prefix
    const firstToken = events.find((e) => e.type === 'token') as
      | Extract<ChatEvent, { type: 'token' }>
      | undefined;
    expect(firstToken?.text).toBe('สวัสดี');

    // reasoning events come before any answer token
    const firstReasoningIdx = events.findIndex((e) => e.type === 'reasoning');
    const firstTokenIdx = events.findIndex((e) => e.type === 'token');
    expect(firstReasoningIdx).toBeLessThan(firstTokenIdx);

    const done = events.at(-1) as Extract<ChatEvent, { type: 'done' }>;
    expect(done.type).toBe('done');
    expect(typeof done.reasoningMs).toBe('number');
  });

  it('sets no reasoningMs when the model does not think (content only)', async () => {
    const svc = new ChatService(
      fakeLlm as never,
      emptyRetrieval as never,
      fakeLog() as never,
      fakeProjectContext() as never,
    );
    const events = await collect(svc.streamChat({ message: 'hi', language: 'th' }));
    const done = events.at(-1) as Extract<ChatEvent, { type: 'done' }>;
    expect(done.reasoningMs).toBeUndefined();
    expect(events.some((e) => e.type === 'reasoning')).toBe(false);
  });

  it('emits an error event with a fallback message when the LLM throws', async () => {
    const throwingLlm = {
      // eslint-disable-next-line require-yield
      async *streamChat() {
        throw new Error('gateway down');
      },
    };
    const svc = new ChatService(
      throwingLlm as never,
      emptyRetrieval as never,
      fakeLog() as never,
      fakeProjectContext() as never,
    );
    const events = await collect(
      svc.streamChat({ message: 'hi', language: 'th' }),
    );

    const err = events.find(
      (e): e is Extract<ChatEvent, { type: 'error' }> => e.type === 'error',
    );
    expect(err).toBeDefined();
    expect(err!.fallbackText.length).toBeGreaterThan(0);
  });

  it('logs the completed turn with accumulated text + cards', async () => {
    const log = fakeLog();
    const svc = new ChatService(
      fakeLlm as never,
      emptyRetrieval as never,
      log as never,
      fakeProjectContext() as never,
    );
    await collect(svc.streamChat({ message: 'hi', language: 'th' }));

    expect(log.calls).toHaveLength(1);
    const call = log.calls[0] as {
      userMessage: string;
      assistantText: string;
      cards: { kind: string; slug?: string }[];
    };
    expect(call.userMessage).toBe('hi');
    expect(call.assistantText).toBe('สวัสดี  ครับ');
    expect(call.cards).toEqual([{ kind: 'project', slug: 'fin-track' }]);
  });

  it('grounds the system prompt in the active project when projectSlug is given', async () => {
    let systemPrompt = '';
    const capturingLlm = {
      async *streamChat(messages: { role: string; content: string }[]) {
        systemPrompt = messages.find((m) => m.role === 'system')?.content ?? '';
        yield { kind: 'content', value: 'ตอบแล้วครับ' };
      },
    };
    const record = {
      slug: 'mangadock',
      title: 'MangaDock',
      titleEn: 'MangaDock',
      description: 'OCR + LLM แปลภาพมังงะอัตโนมัติ',
      content: null,
      category: 'AI Product',
      technologies: ['Next.js'],
      tags: ['ai'],
      liveUrl: null,
    };
    const svc = new ChatService(
      capturingLlm as never,
      emptyRetrieval as never,
      fakeLog() as never,
      fakeProjectContext(record) as never,
    );

    await collect(
      svc.streamChat({ message: 'บอกรายละเอียดผลงานนี้หน่อย', language: 'th', projectSlug: 'mangadock' }),
    );

    expect(systemPrompt).toContain('MangaDock');
    expect(systemPrompt).toContain('AI Product');
  });

  it('does not fetch project context when no projectSlug is given', async () => {
    const projectContext = fakeProjectContext();
    const svc = new ChatService(
      fakeLlm as never,
      emptyRetrieval as never,
      fakeLog() as never,
      projectContext as never,
    );

    await collect(svc.streamChat({ message: 'hi', language: 'th' }));

    expect(projectContext.calls).toHaveLength(0);
  });

  it('degrades gracefully (no ground truth, no crash) when project lookup fails', async () => {
    const throwingProjectContext = {
      getBySlug: async () => {
        throw new Error('db down');
      },
    };
    const svc = new ChatService(
      fakeLlm as never,
      emptyRetrieval as never,
      fakeLog() as never,
      throwingProjectContext as never,
    );

    const events = await collect(
      svc.streamChat({ message: 'hi', language: 'th', projectSlug: 'mangadock' }),
    );

    expect(events.at(-1)?.type).toBe('done');
  });
});
