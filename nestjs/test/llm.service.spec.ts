import { describe, it, expect } from 'bun:test';
import { chunkToDelta } from '../src/llm/llm.service';

// The gateway (qwen3.6-35b-a3b via 9arm) streams chain-of-thought in
// `delta.reasoning_content` BEFORE the answer in `delta.content` (verified live).
// chunkToDelta tags each chunk so the chat layer can route reasoning vs answer.
describe('chunkToDelta', () => {
  it('tags a reasoning_content delta as reasoning', () => {
    expect(
      chunkToDelta({ choices: [{ delta: { reasoning_content: 'Here' } }] }),
    ).toEqual({ kind: 'reasoning', value: 'Here' });
  });

  it('tags a content delta as content', () => {
    expect(chunkToDelta({ choices: [{ delta: { content: 'Hi' } }] })).toEqual({
      kind: 'content',
      value: 'Hi',
    });
  });

  it('preserves leading newlines in content (trimming happens downstream)', () => {
    expect(chunkToDelta({ choices: [{ delta: { content: '\n\n' } }] })).toEqual({
      kind: 'content',
      value: '\n\n',
    });
  });

  it('returns null for a role-only / empty / finish chunk', () => {
    expect(chunkToDelta({ choices: [{ delta: { role: 'assistant', content: '' } }] })).toBeNull();
    expect(chunkToDelta({ choices: [{ delta: {} }] })).toBeNull();
    expect(chunkToDelta({ choices: [{ delta: { content: '' }, finish_reason: 'stop' }] })).toBeNull();
    expect(chunkToDelta({ choices: [] })).toBeNull();
  });
});
