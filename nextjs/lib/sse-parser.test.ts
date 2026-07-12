import { test, expect, describe } from 'bun:test';
import { SSEParser } from './sse-parser';

describe('SSEParser', () => {
  test('parses a single complete frame', () => {
    const p = new SSEParser();
    const events = p.push('event: token\ndata: {"text":"hi"}\n\n');
    expect(events).toEqual([{ event: 'token', data: { text: 'hi' } }]);
  });

  test('parses multiple frames in one chunk', () => {
    const p = new SSEParser();
    const events = p.push(
      'event: session\ndata: {"sessionId":"abc"}\n\nevent: token\ndata: {"text":"yo"}\n\n',
    );
    expect(events.length).toBe(2);
    expect(events[0]).toEqual({ event: 'session', data: { sessionId: 'abc' } });
    expect(events[1]).toEqual({ event: 'token', data: { text: 'yo' } });
  });

  test('buffers a frame split across chunks', () => {
    const p = new SSEParser();
    expect(p.push('event: token\ndata: {"te')).toEqual([]);
    const events = p.push('xt":"split"}\n\n');
    expect(events).toEqual([{ event: 'token', data: { text: 'split' } }]);
  });

  test('ignores keep-alive / blank noise', () => {
    const p = new SSEParser();
    expect(p.push('\n\n')).toEqual([]);
  });

  test('handles a frame with no event name as message', () => {
    const p = new SSEParser();
    const events = p.push('data: {"text":"x"}\n\n');
    expect(events).toEqual([{ event: 'message', data: { text: 'x' } }]);
  });
});
