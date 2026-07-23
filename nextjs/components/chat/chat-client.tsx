"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { SSEParser } from "@/lib/sse-parser";
import {
  shouldShowTypingCursor,
  canSendMessage,
  type MessagePart,
  type ChatStatus,
  type Message,
} from "@/lib/chat-message";
import {
  reduceAssistant,
  toPersistable,
  type StreamEvent,
} from "@/lib/chat-stream";
import { buildProjectGreetingMessage } from "@/lib/project-chat";
import { loadChat, saveChat } from "@/lib/chat-persist";
import { InlineCard, type CardData } from "./inline-card";
import { ThinkingBox } from "./thinking-box";
import { ChatMarkdown } from "./chat-markdown";
import { useChatSession } from "./chat-session-context";

export type { Message };

const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:4100";

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
 * this exact project (deterministic, not just semantic retrieval). Full-page
 * project chat may open with a generated question; embedded chat can wait for
 * visitor-authored input.
 */
export function ChatClient({
  initialProjectSlug,
  initialProjectTitle,
  autoSendProjectQuestion = true,
  persistKey,
  initialMessages,
  initialSessionId,
  conversationId,
  onPersist,
  emptyState,
}: {
  initialProjectSlug?: string;
  initialProjectTitle?: string;
  /** Keep project context ready without sending until the visitor submits. */
  autoSendProjectQuestion?: boolean;
  /** When set, the conversation survives unmount/remount via sessionStorage under
   * this key (used by the floating widget so closing/reopening keeps the chat). */
  persistKey?: string;
  /** Store-backed mode (the /chat app-shell, #39): seed this instance from a
   * specific conversation and report every change back via `onPersist` instead of
   * sessionStorage. The shell mounts these client-only (keyed by conversation id),
   * so seeding from state here can't cause a hydration mismatch. */
  initialMessages?: Message[];
  initialSessionId?: string;
  /** Store-backed mode: the id of the conversation this instance renders. A reply
   * still streaming after the user switches conversations persists back to THIS id
   * (its origin), not the one now on screen (#73). Stable per instance (the shell
   * keys ChatClient by conversation id). */
  conversationId?: string;
  onPersist?: (data: {
    messages: Message[];
    sessionId?: string;
    conversationId?: string;
  }) => void;
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
  // Mirror of `messages` for synchronous reads at event time: send()/regenerate()
  // snapshot the base history from here (the placeholder-free prefix a streaming
  // turn persists against) without waiting for a re-render.
  const messagesRef = useRef(messages);
  messagesRef.current = messages;
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

  // Persist the given message array directly (store-backed mode → onPersist; else
  // sessionStorage). Loop-owned: the streaming loop calls this itself so a reply in
  // flight lands even after this component unmounts on a surface switch (#36). Skips
  // the lone greeting (nothing to remember yet).
  function persistDirect(msgs: Message[]) {
    if (msgs.length <= 1) return;
    const persistable = toPersistable(msgs);
    if (onPersistRef.current) {
      onPersistRef.current({
        messages: persistable,
        sessionId: sessionId.current,
        conversationId,
      });
      return;
    }
    if (!persistKey) return;
    saveChat(window.sessionStorage, persistKey, {
      messages: persistable,
      sessionId: sessionId.current,
    });
  }

  async function send(text: string) {
    const trimmed = text.trim();
    const imgs = attachments;
    if (!canSendMessage(busy, text, imgs.length)) return;

    const userTurn: Message = {
      role: "user",
      parts: trimmed ? [{ type: "text", text: trimmed }] : [],
      images: imgs.length ? imgs : undefined,
    };
    // The base a streaming turn persists against: the history through this user
    // turn (the assistant placeholder is the slot the loop fills and owns).
    const base = [...messagesRef.current, userTurn];
    setMessages((prev) => [
      ...prev,
      userTurn,
      { role: "assistant", parts: [] },
    ]);
    setInput("");
    setAttachments([]);
    await streamAssistant(trimmed, imgs, base);
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
    // Drop the trailing assistant turn; the base is the history up to and including
    // the last user turn, and the fresh placeholder is the slot the loop refills.
    const prior = messagesRef.current;
    const base =
      prior[prior.length - 1]?.role === "assistant"
        ? prior.slice(0, -1)
        : [...prior];
    setMessages(() => [...base, { role: "assistant", parts: [] }]);
    await streamAssistant(messageText(lastUser.parts), lastUser.images ?? [], base);
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

  /** Stream one assistant answer into the trailing placeholder that send()/
   * regenerate() just appended. `base` is the history through the user turn; the
   * loop owns a local accumulator and persists `[...base, assistant]` on every
   * event, so a reply in flight survives an unmount (surface switch) mid-stream
   * (#36) — `setMessages` no-ops after unmount, but `persistDirect` still lands. */
  async function streamAssistant(
    userText: string,
    images: string[] = [],
    base: Message[] = [],
  ) {
    setStatus("thinking");
    reasoningStartRef.current = undefined;
    scrollToEnd();

    // Loop-owned accumulator — the source of truth for what gets persisted.
    let assistant: Message = { role: "assistant", parts: [] };
    const commit = (ev: StreamEvent) => {
      assistant = reduceAssistant(assistant, ev, reasoningStartRef.current);
      const next = assistant;
      setMessages((prev) => {
        const arr = [...prev];
        const i = arr.length - 1;
        if (arr[i]?.role === "assistant") arr[i] = next;
        return arr;
      });
      persistDirect([...base, next]);
      scrollToEnd();
    };

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
              commit({ kind: "reasoning", text: data.text as string });
              break;
            case "token":
              setStatus("streaming");
              // First answer token ends the thinking phase — reduceAssistant stamps
              // its duration from reasoningStartRef, using this token's timestamp.
              commit({ kind: "token", text: data.text as string, at: Date.now() });
              break;
            case "card":
              commit({ kind: "card", card: data as unknown as CardData });
              break;
            case "done":
              setStatus("idle");
              reportTurnComplete();
              break;
            case "error":
              commit({
                kind: "error",
                text:
                  (data.fallbackText as string) ?? "ขออภัย ระบบขัดข้องชั่วคราว",
              });
              setStatus("error");
              break;
          }
        }
      }
      setStatus((s) => (s === "error" ? "error" : "idle"));
    } catch {
      commit({
        kind: "error",
        text: "ขออภัยครับ ตอนนี้เชื่อมต่อผู้ช่วย AI ไม่ได้ ลองใหม่อีกครั้ง หรือติดต่อทีมโดยตรงได้เลย",
      });
      setStatus("error");
    }
  }

  useEffect(() => {
    if (
      autoSendProjectQuestion &&
      initialProjectSlug &&
      initialProjectTitle &&
      !autoSentRef.current
    ) {
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

  // Persist on every state change too — covers non-stream mutations and the normal
  // mounted case. The streaming loop also persists directly (loop-owned, #36); both
  // paths are idempotent, so a mounted stream harmlessly writes through both.
  useEffect(() => {
    persistDirect(messages);
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
          disabled={attachments.length >= 4}
          aria-label="แนบรูปภาพ"
        >
          <PlusIcon />
        </button>
        {/* Editable while the assistant is responding — you can compose the next
            message; only sending waits for the reply to finish. */}
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="พิมพ์ข้อความ…"
          aria-label="พิมพ์ข้อความถึงผู้ช่วย AI"
        />
        <button
          type="submit"
          className="chat-send"
          aria-label="ส่งข้อความ"
          disabled={!canSendMessage(busy, input, attachments.length)}
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
