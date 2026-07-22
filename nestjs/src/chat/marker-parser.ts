/**
 * Parses an LLM token stream, extracting inline card markers so the transport
 * can emit them as separate events instead of leaking them into visible text.
 *
 * Markers: `[PROJECT:<slug>]` and `[SERVICE:<id>]`. Markers may be split across
 * streamed deltas, so the parser buffers a tail that could still be forming one.
 * Framework-agnostic on purpose — no Nest.js coupling.
 */

export type CardRef =
  | { kind: 'project'; slug: string }
  | { kind: 'service'; id: string; title?: string; description?: string };

export type ParseEvent =
  { type: 'text'; value: string } | { type: 'card'; card: CardRef };

const FULL_MARKER = /^\[(PROJECT|SERVICE):([A-Za-z0-9_-]+)\]/;
const MARKER_PREFIXES = ['PROJECT:', 'SERVICE:'];
// A '[' that never closes within this many chars is treated as literal text.
const MAX_MARKER_LEN = 128;

export class StreamMarkerParser {
  private buffer = '';

  push(delta: string): ParseEvent[] {
    this.buffer += delta;
    return this.drain(false);
  }

  /** Call once the stream ends; any held partial marker becomes literal text. */
  flush(): ParseEvent[] {
    return this.drain(true);
  }

  private drain(final: boolean): ParseEvent[] {
    const events: ParseEvent[] = [];
    let text = '';

    while (this.buffer.length > 0) {
      const open = this.buffer.indexOf('[');
      if (open === -1) {
        text += this.buffer;
        this.buffer = '';
        break;
      }

      text += this.buffer.slice(0, open);
      this.buffer = this.buffer.slice(open); // now starts with '['

      const full = FULL_MARKER.exec(this.buffer);
      if (full) {
        if (text) {
          events.push({ type: 'text', value: text });
          text = '';
        }
        const [matched, keyword, value] = full;
        events.push({
          type: 'card',
          card:
            keyword === 'PROJECT'
              ? { kind: 'project', slug: value }
              : { kind: 'service', id: value },
        });
        this.buffer = this.buffer.slice(matched.length);
        continue;
      }

      // Not a complete marker. If it could still become one, wait for more.
      if (
        !final &&
        this.buffer.length <= MAX_MARKER_LEN &&
        this.isPotentialMarker(this.buffer)
      ) {
        break;
      }

      // Literal '[' — emit it and keep scanning.
      text += '[';
      this.buffer = this.buffer.slice(1);
    }

    if (text) events.push({ type: 'text', value: text });
    return events;
  }

  private isPotentialMarker(s: string): boolean {
    const body = s.slice(1); // drop the leading '['
    for (const keyword of MARKER_PREFIXES) {
      // Still typing the keyword itself, e.g. '[PRO'.
      if (keyword.startsWith(body)) return true;
      // Keyword done, collecting the value, no closing ']' yet.
      if (body.startsWith(keyword) && !body.includes(']')) return true;
    }
    return false;
  }
}
