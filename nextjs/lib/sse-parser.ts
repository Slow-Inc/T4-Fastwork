/**
 * Incremental Server-Sent Events parser for the chat stream (docs/api/chat.md).
 * Feed raw text chunks from a fetch ReadableStream; get back fully-formed
 * frames. Partial frames are buffered until their terminating blank line.
 */
export interface SSEEvent {
  event: string;
  data: unknown;
}

export class SSEParser {
  private buffer = '';

  push(chunk: string): SSEEvent[] {
    this.buffer += chunk;
    const events: SSEEvent[] = [];

    let sep: number;
    // Frames are separated by a blank line (\n\n).
    while ((sep = this.buffer.indexOf('\n\n')) !== -1) {
      const rawFrame = this.buffer.slice(0, sep);
      this.buffer = this.buffer.slice(sep + 2);

      let eventName = 'message';
      const dataLines: string[] = [];
      for (const line of rawFrame.split('\n')) {
        if (line.startsWith('event:')) {
          eventName = line.slice(6).trim();
        } else if (line.startsWith('data:')) {
          dataLines.push(line.slice(5).trim());
        }
      }

      if (dataLines.length === 0) continue; // keep-alive / blank noise

      const dataStr = dataLines.join('\n');
      let data: unknown = dataStr;
      try {
        data = JSON.parse(dataStr);
      } catch {
        // leave as string if not JSON
      }
      events.push({ event: eventName, data });
    }

    return events;
  }
}
