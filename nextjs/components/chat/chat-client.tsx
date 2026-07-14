"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { SSEParser } from "@/lib/sse-parser";
import {
  appendToken,
  appendCard,
  shouldShowTypingCursor,
  type MessagePart,
  type ChatStatus,
} from "@/lib/chat-message";
import { buildProjectGreetingMessage } from "@/lib/project-chat";
import { loadChat, saveChat } from "@/lib/chat-persist";
import { InlineCard, type CardData } from "./inline-card";
import { ThinkingBox } from "./thinking-box";
import { ChatMarkdown } from "./chat-markdown";
import { useChatSession } from "./chat-session-context";

const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:4100";

export interface Message {
  role: "user" | "assistant";
  parts: MessagePart[];
  /** The model's chain-of-thought (Open WebUI style), accumulated from reasoning
   * events; shown in a collapsible box above the answer. */
  reasoning?: string;
  /** Thinking duration (reasoning start → first answer token), ms. */
  reasoningMs?: number;
  /** Inline images (data URLs) attached to a user turn (#42). Rendered in the
   * turn; NOT persisted (stripped before storage to keep it lean). */
  images?: string[];
}

type Status = ChatStatus;

const GREETING: Message = {
  role: "assistant",
  parts: [
    {
      type: "text",
      text: "สวัสดีครับ ผมคือผู้ช่วย AI ของ T4 Labs — เล่าโจทย์ของคุณมาได้เลย ผมจะแนะนำเคสงานที่ใกล้เคียงและช่วยประเมินเบื้องต้นให้ครับ",
    },
  ],
};

const QUICK_REPLIES = [
  "อยากได้ SaaS platform",
  "ทำ AI chatbot ได้ไหม",
  "แนะนำเคสงานที่เหมาะกับฉัน",
  "ประเมินงบเบื้องต้น",
];

/** The plain text of a message (its text runs joined) — for copy + regenerate. */
function messageText(parts: MessagePart[]): string {
  return parts
    .filter((p) => p.type === "text")
    .map((p) => (p as { type: "text"; text: string }).text)
    .join("");
}

/** Empty-state suggestion rows (Open WebUI's `⚡ Suggested`, in our style): a
 * bold prompt + a muted subtitle explaining what it does. The title is what gets
 * sent. Mirrors QUICK_REPLIES but richer for the first-run screen (#40). */
const SUGGESTIONS: { title: string; subtitle: string }[] = [
  {
    title: "อยากได้ SaaS platform",
    subtitle: "เล่าโจทย์ แล้วให้ AI แนะนำสถาปัตยกรรม + เคสงานที่ใกล้เคียง",
  },
  {
    title: "ทำ AI chatbot ได้ไหม",
    subtitle: "ดูว่าเราสร้าง RAG / แชตบอทให้ธุรกิจได้อย่างไร",
  },
  {
    title: "แนะนำเคสงานที่เหมาะกับฉัน",
    subtitle: "บอกอุตสาหกรรมหรืองบ แล้วรับผลงานที่ตรงที่สุด",
  },
  {
    title: "ประเมินงบเบื้องต้น",
    subtitle: "สรุปขอบเขตงาน + ช่วงราคาเบื้องต้นจากโจทย์ของคุณ",
  },
];

/**
 * @param initialProjectSlug When set (Requirement §5.4), grounds every turn in
 * this exact project (deterministic, not just semantic retrieval) and opens
 * with a question about it.
 */
export function ChatClient({
  initialProjectSlug,
  initialProjectTitle,
  persistKey,
  initialMessages,
  initialSessionId,
  onPersist,
  emptyState,
}: {
  initialProjectSlug?: string;
  initialProjectTitle?: string;
  /** When set, the conversation survives unmount/remount via sessionStorage under
   * this key (used by the floating widget so closing/reopening keeps the chat). */
  persistKey?: string;
  /** Store-backed mode (the /chat app-shell, #39): seed this instance from a
   * specific conversation and report every change back via `onPersist` instead of
   * sessionStorage. The shell mounts these client-only (keyed by conversation id),
   * so seeding from state here can't cause a hydration mismatch. */
  initialMessages?: Message[];
  initialSessionId?: string;
  onPersist?: (data: { messages: Message[]; sessionId?: string }) => void;
  /** Open WebUI-style first-run screen (the /chat app-shell, #40): before any user
   * turn, show a centered identity + suggestion list instead of a greeting bubble
   * and quick-reply chips. The popup keeps the compact greeting (emptyState off). */
  emptyState?: boolean;
} = {}) {
  // Always start from the deterministic greeting so the server and the first
  // client render produce identical HTML. A persisted conversation is restored
  // AFTER mount (effect below) — reading sessionStorage during render caused a
  // hydration mismatch on the SSR'd /chat page, which passes persistKey since #31
  // shared the popup↔page conversation.
  const [messages, setMessages] = useState<Message[]>(
    initialMessages && initialMessages.length
      ? initialMessages
      : // Empty-state mode opens on the first-run hero (no greeting bubble); the
        // popup/grounded modes open on the greeting message.
        emptyState
        ? []
        : [GREETING],
  );
  const [input, setInput] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const copyTimer = useRef<ReturnType<typeof setTimeout> | undefined>(
    undefined,
  );
  // Inline image attachments (data URLs) staged for the next turn (#42).
  const [attachments, setAttachments] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [projectSlug, setProjectSlug] = useState(initialProjectSlug);
  const sessionId = useRef<string | undefined>(initialSessionId);
  // Latest onPersist, held in a ref so the persist effect doesn't re-fire on the
  // shell's re-renders (the callback identity changes each render).
  const onPersistRef = useRef(onPersist);
  onPersistRef.current = onPersist;
  const scrollRef = useRef<HTMLDivElement>(null);
  const autoSentRef = useRef(false);
  // When the current turn's reasoning stream began (Date.now); used to time the
  // thinking duration at the first answer token.
  const reasoningStartRef = useRef<number | undefined>(undefined);
  const { reportSession, reportTurnComplete } = useChatSession();

  const busy = status === "thinking" || status === "streaming";
  // First-run screen: only in emptyState mode (the /chat app-shell) and only until
  // the first user turn. The popup/grounded modes never show it.
  const showEmpty =
    Boolean(emptyState) && !messages.some((m) => m.role === "user");

  function scrollToEnd() {
    requestAnimationFrame(() => {
      scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight });
    });
  }

  // Mutate the last assistant message's parts through a reducer.
  function updateLastAssistant(fn: (parts: MessagePart[]) => MessagePart[]) {
    mutateLastAssistant((m) => ({ ...m, parts: fn(m.parts) }));
  }

  // Mutate the whole last assistant message (parts + reasoning fields).
  function mutateLastAssistant(fn: (m: Message) => Message) {
    setMessages((prev) => {
      const next = [...prev];
      const last = next[next.length - 1];
      if (last?.role === "assistant") next[next.length - 1] = fn(last);
      return next;
    });
    scrollToEnd();
  }

  async function send(text: string) {
    const trimmed = text.trim();
    const imgs = attachments;
    if ((!trimmed && imgs.length === 0) || busy) return;

    setMessages((prev) => [
      ...prev,
      {
        role: "user",
        parts: trimmed ? [{ type: "text", text: trimmed }] : [],
        images: imgs.length ? imgs : undefined,
      },
      { role: "assistant", parts: [] },
    ]);
    setInput("");
    setAttachments([]);
    await streamAssistant(trimmed, imgs);
  }

  function addFiles(files: FileList | null) {
    if (!files) return;
    const room = 4 - attachments.length;
    [...files]
      .filter((f) => f.type.startsWith("image/"))
      .slice(0, Math.max(0, room))
      .forEach((f) => {
        const reader = new FileReader();
        reader.onload = () => {
          if (typeof reader.result === "string") {
            setAttachments((prev) => [...prev, reader.result as string]);
          }
        };
        reader.readAsDataURL(f);
      });
  }

  function removeAttachment(index: number) {
    setAttachments((prev) => prev.filter((_, i) => i !== index));
  }

  /** Resend the previous user turn to produce a fresh answer (#41): drop the
   * trailing assistant turn, add an empty placeholder, and stream into it. */
  async function regenerate() {
    if (busy) return;
    const lastUser = [...messages].reverse().find((m) => m.role === "user");
    if (!lastUser) return;
    setMessages((prev) => {
      const next = [...prev];
      if (next[next.length - 1]?.role === "assistant") next.pop();
      next.push({ role: "assistant", parts: [] });
      return next;
    });
    await streamAssistant(messageText(lastUser.parts), lastUser.images ?? []);
  }

  async function copyMessage(index: number, parts: MessagePart[]) {
    try {
      await navigator.clipboard.writeText(messageText(parts));
      setCopiedIndex(index);
      clearTimeout(copyTimer.current);
      copyTimer.current = setTimeout(() => setCopiedIndex(null), 1500);
    } catch {
      // clipboard blocked (insecure context / permission) — no-op.
    }
  }

  /** Stream one assistant answer. Assumes the last message is an empty assistant
   * placeholder (send() and regenerate() both guarantee this). */
  async function streamAssistant(userText: string, images: string[] = []) {
    setStatus("thinking");
    reasoningStartRef.current = undefined;
    scrollToEnd();

    try {
      const res = await fetch(`${API_BASE}/chat/stream`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: userText,
          language: "th",
          sessionId: sessionId.current,
          projectSlug,
          images: images.length ? images : undefined,
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
            case "session":
              sessionId.current = data.sessionId as string;
              reportSession(sessionId.current);
              break;
            case "reasoning":
              if (reasoningStartRef.current === undefined) {
                reasoningStartRef.current = Date.now();
              }
              mutateLastAssistant((m) => ({
                ...m,
                reasoning: (m.reasoning ?? "") + (data.text as string),
              }));
              break;
            case "token": {
              setStatus("streaming");
              // First answer token ends the thinking phase — stamp its duration.
              const started = reasoningStartRef.current;
              mutateLastAssistant((m) => ({
                ...m,
                parts: appendToken(m.parts, data.text as string),
                reasoningMs:
                  m.reasoningMs ??
                  (started !== undefined ? Date.now() - started : undefined),
              }));
              break;
            }
            case "card":
              updateLastAssistant((p) =>
                appendCard(p, data as unknown as CardData),
              );
              break;
            case "done":
              setStatus("idle");
              reportTurnComplete();
              break;
            case "error":
              updateLastAssistant((p) =>
                appendToken(
                  p,
                  (data.fallbackText as string) ?? "ขออภัย ระบบขัดข้องชั่วคราว",
                ),
              );
              setStatus("error");
              break;
          }
        }
      }
      setStatus((s) => (s === "error" ? "error" : "idle"));
    } catch {
      updateLastAssistant((p) =>
        appendToken(
          p,
          "ขออภัยครับ ตอนนี้เชื่อมต่อผู้ช่วย AI ไม่ได้ ลองใหม่อีกครั้ง หรือติดต่อทีมโดยตรงได้เลย",
        ),
      );
      setStatus("error");
    }
  }

  useEffect(() => {
    if (initialProjectSlug && initialProjectTitle && !autoSentRef.current) {
      autoSentRef.current = true;
      send(buildProjectGreetingMessage(initialProjectTitle));
    }
    // Only ever auto-sends once, on mount, guarded by autoSentRef.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Restore a persisted conversation after mount (client-only) — messages AND the
  // backend sessionId (a ref, so reopening keeps the assistant's memory too). Doing
  // this post-hydration (not in the useState initializer) keeps SSR/client HTML
  // identical, avoiding a hydration mismatch on /chat.
  useEffect(() => {
    // Store-backed instances are seeded via initialMessages, not sessionStorage.
    if (onPersistRef.current || !persistKey) return;
    const saved = loadChat(window.sessionStorage, persistKey);
    if (saved) {
      // Intentional post-mount restore: sessionStorage is SSR-unsafe, so seeding in
      // the initializer would mismatch on hydration. One restore render, not a cascade.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      if (saved.messages?.length) setMessages(saved.messages as Message[]);
      if (saved.sessionId) sessionId.current = saved.sessionId;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Persist after every change (skip the lone greeting — nothing to remember yet).
  // Store-backed mode reports to the app-shell; otherwise sessionStorage (popup).
  useEffect(() => {
    if (messages.length <= 1) return;
    // Never persist base64 images (quota); keep only the text of each turn.
    const persistable = messages.map((m) =>
      m.images ? { ...m, images: undefined } : m,
    );
    if (onPersistRef.current) {
      onPersistRef.current({
        messages: persistable,
        sessionId: sessionId.current,
      });
      return;
    }
    if (!persistKey) return;
    saveChat(window.sessionStorage, persistKey, {
      messages: persistable,
      sessionId: sessionId.current,
    });
  }, [messages, persistKey]);

  // Clear a pending "copied" reset if we unmount (e.g. switching conversations).
  useEffect(() => () => clearTimeout(copyTimer.current), []);

  return (
    <div className="chat-full">
      {projectSlug && initialProjectTitle && (
        <div className="chat-project-banner">
          <span>กำลังคุยเกี่ยวกับผลงาน: {initialProjectTitle}</span>
          <button
            type="button"
            aria-label="เลิกอ้างอิงผลงานนี้"
            onClick={() => setProjectSlug(undefined)}
          >
            ✕
          </button>
        </div>
      )}
      <div
        className={`chat-scroll${showEmpty ? " is-empty" : ""}`}
        ref={scrollRef}
      >
        {showEmpty ? (
          <div className="chat-empty">
            <div className="chat-empty-head">
              <span className="chat-empty-dot" aria-hidden="true" />
              <h2 className="chat-empty-title">ผู้ช่วย AI</h2>
              <p className="chat-empty-tagline">
                เล่าโจทย์ของคุณ —
                ผมจะแนะนำเคสงานที่ใกล้เคียงและช่วยประเมินเบื้องต้นให้ครับ
              </p>
            </div>
            <div className="chat-suggest">
              <div className="chat-suggest-label">
                <BoltIcon />
                แนะนำ
              </div>
              <ul>
                {SUGGESTIONS.map((s) => (
                  <li key={s.title}>
                    <button
                      type="button"
                      className="chat-suggest-row"
                      disabled={busy}
                      onClick={() => send(s.title)}
                    >
                      <span className="chat-suggest-title">{s.title}</span>
                      <span className="chat-suggest-sub">{s.subtitle}</span>
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        ) : (
          messages.map((m, i) => {
            const isLast = i === messages.length - 1;
            return (
              <article key={i} className={`chat-turn chat-${m.role}`}>
                <div className="chat-turn-label">
                  {m.role === "assistant" ? (
                    <>
                      <span className="chat-turn-dot" aria-hidden="true" />
                      ผู้ช่วย AI
                    </>
                  ) : (
                    "คุณ"
                  )}
                </div>
                <div className="chat-turn-body">
                  {m.images && m.images.length > 0 && (
                    <div className="chat-msg-images">
                      {m.images.map((src, k) => (
                        // Inline data-URL image — next/image can't optimize these.
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          key={k}
                          src={src}
                          alt="รูปที่แนบ"
                          className="chat-msg-image"
                        />
                      ))}
                    </div>
                  )}
                  {m.role === "assistant" && m.reasoning && (
                    <ThinkingBox
                      reasoning={m.reasoning}
                      durationMs={m.reasoningMs}
                      live={isLast && status === "thinking"}
                    />
                  )}
                  {m.parts.map((part, j) =>
                    part.type === "text" ? (
                      m.role === "assistant" ? (
                        <ChatMarkdown key={j}>{part.text}</ChatMarkdown>
                      ) : (
                        <span key={j} className="chat-text">
                          {part.text}
                        </span>
                      )
                    ) : (
                      <InlineCard key={j} card={part.card} />
                    ),
                  )}
                  {m.role === "assistant" &&
                    isLast &&
                    status === "thinking" &&
                    !m.reasoning && (
                      <span className="chat-thinking">
                        <span className="chat-caret" aria-hidden="true" />
                        กำลังคิด
                      </span>
                    )}
                  {shouldShowTypingCursor(m.role, isLast, status) && (
                    <span className="typing-cursor" aria-hidden="true" />
                  )}
                  {m.role === "assistant" &&
                    messageText(m.parts).length > 0 &&
                    !(isLast && busy) && (
                      <div className="chat-actions">
                        <button
                          type="button"
                          className="chat-action"
                          onClick={() => copyMessage(i, m.parts)}
                          aria-label={
                            copiedIndex === i ? "คัดลอกแล้ว" : "คัดลอกคำตอบ"
                          }
                        >
                          {copiedIndex === i ? <CheckIcon /> : <CopyIcon />}
                          <span className="chat-action-label">
                            {copiedIndex === i ? "คัดลอกแล้ว" : "คัดลอก"}
                          </span>
                        </button>
                        {isLast && (
                          <button
                            type="button"
                            className="chat-action"
                            onClick={regenerate}
                            disabled={busy}
                            aria-label="สร้างคำตอบใหม่"
                          >
                            <RegenIcon />
                            <span className="chat-action-label">สร้างใหม่</span>
                          </button>
                        )}
                      </div>
                    )}
                </div>
              </article>
            );
          })
        )}
      </div>

      {status === "error" && (
        <div className="chat-error-cta">
          <Link href="/contact" className="btn ghost">
            ติดต่อทีมโดยตรง
          </Link>
        </div>
      )}

      {!emptyState && (
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
      )}

      {attachments.length > 0 && (
        <div className="chat-attachments">
          {attachments.map((src, k) => (
            <div key={k} className="chat-attach-thumb">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={src} alt={`รูปที่แนบ ${k + 1}`} />
              <button
                type="button"
                onClick={() => removeAttachment(k)}
                aria-label={`ลบรูปที่แนบ ${k + 1}`}
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      )}

      <form
        className="chat-input-row"
        onSubmit={(e) => {
          e.preventDefault();
          send(input);
        }}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          hidden
          onChange={(e) => {
            addFiles(e.target.files);
            e.target.value = "";
          }}
        />
        <button
          type="button"
          className="chat-attach"
          onClick={() => fileInputRef.current?.click()}
          disabled={busy || attachments.length >= 4}
          aria-label="แนบรูปภาพ"
        >
          <PlusIcon />
        </button>
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="พิมพ์ข้อความ…"
          aria-label="พิมพ์ข้อความถึงผู้ช่วย AI"
          disabled={busy}
        />
        <button
          type="submit"
          className="chat-send"
          aria-label="ส่งข้อความ"
          disabled={busy || (!input.trim() && attachments.length === 0)}
        >
          ↑
        </button>
      </form>

      <p className="chat-disclaimer t-meta">
        AI อาจมีข้อผิดพลาด โปรดตรวจสอบข้อมูลก่อนตัดสินใจ
      </p>
    </div>
  );
}

/** The one accent mark on the empty-state — a small lightning bolt beside แนะนำ. */
function BoltIcon() {
  return (
    <svg
      width="12"
      height="12"
      viewBox="0 0 16 16"
      fill="none"
      aria-hidden="true"
    >
      <path d="M9 1.5 3.5 9H7l-1 5.5L12.5 7H9z" fill="currentColor" />
    </svg>
  );
}

function PlusIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M8 3.5v9M3.5 8h9"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

function CopyIcon() {
  return (
    <svg
      width="13"
      height="13"
      viewBox="0 0 16 16"
      fill="none"
      aria-hidden="true"
    >
      <rect
        x="5.5"
        y="5.5"
        width="8"
        height="8"
        rx="1.5"
        stroke="currentColor"
        strokeWidth="1.3"
      />
      <path
        d="M10.5 5.5V4A1.5 1.5 0 0 0 9 2.5H4A1.5 1.5 0 0 0 2.5 4v5A1.5 1.5 0 0 0 4 10.5h1.5"
        stroke="currentColor"
        strokeWidth="1.3"
      />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg
      width="13"
      height="13"
      viewBox="0 0 16 16"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M3 8.5 6.5 12 13 4.5"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function RegenIcon() {
  return (
    <svg
      width="13"
      height="13"
      viewBox="0 0 16 16"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M13 3.5v3h-3M3 12.5v-3h3"
        stroke="currentColor"
        strokeWidth="1.3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M12.4 6.5a4.5 4.5 0 0 0-8-1.2M3.6 9.5a4.5 4.5 0 0 0 8 1.2"
        stroke="currentColor"
        strokeWidth="1.3"
        strokeLinecap="round"
      />
    </svg>
  );
}
