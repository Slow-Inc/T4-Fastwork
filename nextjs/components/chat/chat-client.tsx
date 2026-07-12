'use client';

import { useRef, useState } from 'react';
import Link from 'next/link';
import { SSEParser } from '@/lib/sse-parser';
import { appendToken, appendCard, type MessagePart } from '@/lib/chat-message';
import { InlineCard, type CardData } from './inline-card';
import { useChatSession } from './chat-session-context';

const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:4100';

interface Message {
  role: 'user' | 'assistant';
  parts: MessagePart[];
}

type Status = 'idle' | 'thinking' | 'streaming' | 'error';

const GREETING: Message = {
  role: 'assistant',
  parts: [
    {
      type: 'text',
      text: 'สวัสดีครับ ผมคือผู้ช่วย AI ของ T4 Labs — เล่าโจทย์ของคุณมาได้เลย ผมจะแนะนำเคสงานที่ใกล้เคียงและช่วยประเมินเบื้องต้นให้ครับ',
    },
  ],
};

const QUICK_REPLIES = [
  'อยากได้ SaaS platform',
  'ทำ AI chatbot ได้ไหม',
  'แนะนำเคสงานที่เหมาะกับฉัน',
  'ประเมินงบเบื้องต้น',
];

export function ChatClient() {
  const [messages, setMessages] = useState<Message[]>([GREETING]);
  const [input, setInput] = useState('');
  const [status, setStatus] = useState<Status>('idle');
  const sessionId = useRef<string | undefined>(undefined);
  const scrollRef = useRef<HTMLDivElement>(null);
  const { reportSession, reportTurnComplete } = useChatSession();

  const busy = status === 'thinking' || status === 'streaming';

  function scrollToEnd() {
    requestAnimationFrame(() => {
      scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight });
    });
  }

  // Mutate the last assistant message's parts through a reducer.
  function updateLastAssistant(fn: (parts: MessagePart[]) => MessagePart[]) {
    setMessages((prev) => {
      const next = [...prev];
      const last = next[next.length - 1];
      if (last?.role === 'assistant') {
        next[next.length - 1] = { role: 'assistant', parts: fn(last.parts) };
      }
      return next;
    });
    scrollToEnd();
  }

  async function send(text: string) {
    const trimmed = text.trim();
    if (!trimmed || busy) return;

    setMessages((prev) => [
      ...prev,
      { role: 'user', parts: [{ type: 'text', text: trimmed }] },
      { role: 'assistant', parts: [] },
    ]);
    setInput('');
    setStatus('thinking');
    scrollToEnd();

    try {
      const res = await fetch(`${API_BASE}/chat/stream`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: trimmed,
          language: 'th',
          sessionId: sessionId.current,
        }),
      });

      if (!res.ok || !res.body) throw new Error(`HTTP ${res.status}`);

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      const parser = new SSEParser();

      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        const events = parser.push(decoder.decode(value, { stream: true }));
        for (const ev of events) {
          const data = ev.data as Record<string, unknown>;
          switch (ev.event) {
            case 'session':
              sessionId.current = data.sessionId as string;
              reportSession(sessionId.current);
              break;
            case 'token':
              setStatus('streaming');
              updateLastAssistant((p) => appendToken(p, data.text as string));
              break;
            case 'card':
              updateLastAssistant((p) => appendCard(p, data as unknown as CardData));
              break;
            case 'done':
              setStatus('idle');
              reportTurnComplete();
              break;
            case 'error':
              updateLastAssistant((p) =>
                appendToken(
                  p,
                  (data.fallbackText as string) ??
                    'ขออภัย ระบบขัดข้องชั่วคราว',
                ),
              );
              setStatus('error');
              break;
          }
        }
      }
      setStatus((s) => (s === 'error' ? 'error' : 'idle'));
    } catch {
      updateLastAssistant((p) =>
        appendToken(
          p,
          'ขออภัยครับ ตอนนี้เชื่อมต่อผู้ช่วย AI ไม่ได้ ลองใหม่อีกครั้ง หรือติดต่อทีมโดยตรงได้เลย',
        ),
      );
      setStatus('error');
    }
  }

  return (
    <div className="chat-full">
      <div className="chat-scroll" ref={scrollRef}>
        {messages.map((m, i) => (
          <div key={i} className={`chat-msg chat-${m.role}`}>
            <div className="chat-bubble">
              {m.parts.map((part, j) =>
                part.type === 'text' ? (
                  <span key={j} className="chat-text">
                    {part.text}
                  </span>
                ) : (
                  <InlineCard key={j} card={part.card} />
                ),
              )}
              {m.role === 'assistant' &&
                i === messages.length - 1 &&
                status === 'thinking' && (
                  <span className="chat-thinking">กำลังคิด…</span>
                )}
            </div>
          </div>
        ))}
      </div>

      {status === 'error' && (
        <div className="chat-error-cta">
          <Link href="/contact" className="btn ghost">
            ติดต่อทีมโดยตรง
          </Link>
        </div>
      )}

      <div className="chat-quick">
        {QUICK_REPLIES.map((q) => (
          <button
            key={q}
            type="button"
            className="quick-chip"
            disabled={busy}
            onClick={() => send(q)}
          >
            {q}
          </button>
        ))}
      </div>

      <form
        className="chat-input-row"
        onSubmit={(e) => {
          e.preventDefault();
          send(input);
        }}
      >
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="พิมพ์ข้อความ…"
          aria-label="พิมพ์ข้อความถึงผู้ช่วย AI"
          disabled={busy}
        />
        <button type="submit" className="btn" disabled={busy || !input.trim()}>
          ส่ง
        </button>
      </form>

      <p className="chat-disclaimer t-meta">
        AI อาจมีข้อผิดพลาด โปรดตรวจสอบข้อมูลก่อนตัดสินใจ
      </p>
    </div>
  );
}
