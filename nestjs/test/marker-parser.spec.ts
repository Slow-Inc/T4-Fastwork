import { describe, it, expect } from 'bun:test';
import { StreamMarkerParser, type CardRef } from '../src/chat/marker-parser';

/**
 * Feed a sequence of streamed deltas through a fresh parser and collect the
 * aggregate result: the visible text (markers stripped) and the ordered cards.
 * Asserting the aggregate keeps tests at the public seam, not the internal
 * chunk-by-chunk event shape.
 */
function run(chunks: string[]): { text: string; cards: CardRef[] } {
  const parser = new StreamMarkerParser();
  let text = '';
  const cards: CardRef[] = [];
  const drain = (events: ReturnType<StreamMarkerParser['push']>) => {
    for (const ev of events) {
      if (ev.type === 'text') text += ev.value;
      else cards.push(ev.card);
    }
  };
  for (const c of chunks) drain(parser.push(c));
  drain(parser.flush());
  return { text, cards };
}

describe('StreamMarkerParser', () => {
  it('passes plain text through unchanged', () => {
    expect(run(['Hello world'])).toEqual({ text: 'Hello world', cards: [] });
  });

  it('extracts a project marker and strips it from the text', () => {
    expect(run(['Hello [PROJECT:fin-track] world'])).toEqual({
      text: 'Hello  world',
      cards: [{ kind: 'project', slug: 'fin-track' }],
    });
  });

  it('extracts a service marker by numeric id', () => {
    expect(run(['We built [SERVICE:3] for them'])).toEqual({
      text: 'We built  for them',
      cards: [{ kind: 'service', id: '3' }],
    });
  });

  it('reassembles a marker split across deltas', () => {
    expect(run(['See [PRO', 'JECT:abc] and [SER', 'VICE:12] end'])).toEqual({
      text: 'See  and  end',
      cards: [
        { kind: 'project', slug: 'abc' },
        { kind: 'service', id: '12' },
      ],
    });
  });

  it('treats a non-marker bracket as literal text', () => {
    expect(run(['array[0] = 1'])).toEqual({ text: 'array[0] = 1', cards: [] });
  });

  it('emits an unterminated marker as literal text on flush', () => {
    expect(run(['text [PROJECT:incompl'])).toEqual({
      text: 'text [PROJECT:incompl',
      cards: [],
    });
  });
});
