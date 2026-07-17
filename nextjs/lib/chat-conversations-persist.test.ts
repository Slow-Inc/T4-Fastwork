import { describe, it, expect } from "bun:test";
import {
  applyPersist,
  DEFAULT_TITLE,
  type ConversationState,
} from "./chat-conversations";

// A two-conversation store with B active — the setup for the #73 corruption:
// a stream that started in A must persist to A even while B is active.
function baseState(): ConversationState {
  return {
    conversations: [
      {
        id: "A",
        title: "Conv A",
        messages: [{ role: "user", parts: [{ type: "text", text: "a1" }] }],
        sessionId: "sa",
        updatedAt: 1,
      },
      {
        id: "B",
        title: "Conv B",
        messages: [{ role: "user", parts: [{ type: "text", text: "b1" }] }],
        sessionId: "sb",
        updatedAt: 2,
      },
    ],
    activeId: "B",
    migratedFloating: false,
  };
}

const streamMsgs = (tag: string) => [
  { role: "user", parts: [{ type: "text", text: tag }] },
  { role: "assistant", parts: [{ type: "text", text: "reply " + tag }] },
];
const NOW = 5000;

describe("applyPersist", () => {
  it("persists to the originating conversation, not the active one (#73)", () => {
    const s = baseState();
    const next = applyPersist(
      s,
      { messages: streamMsgs("A-stream"), sessionId: "sa2", conversationId: "A" },
      NOW,
    );
    const A = next.conversations.find((c) => c.id === "A")!;
    const B = next.conversations.find((c) => c.id === "B")!;
    expect(A.messages).toEqual(streamMsgs("A-stream")); // A got the stream
    expect(A.sessionId).toBe("sa2");
    expect(A.updatedAt).toBe(NOW);
    expect(B.messages).toEqual(baseState().conversations[1].messages); // B untouched
    expect(next.activeId).toBe("B");
  });

  it("no-ops if the originating conversation was deleted mid-stream", () => {
    const s = baseState();
    const next = applyPersist(
      s,
      { messages: streamMsgs("x"), conversationId: "gone" },
      NOW,
    );
    expect(next).toBe(s); // unchanged reference — never resurrect a deleted conv
  });

  it("falls back to the active conversation when no conversationId is given", () => {
    const s = baseState();
    const next = applyPersist(s, { messages: streamMsgs("via-active") }, NOW);
    const B = next.conversations.find((c) => c.id === "B")!;
    expect(B.messages).toEqual(streamMsgs("via-active"));
  });

  it("derives a title for a still-default conversation from its messages", () => {
    const s = baseState();
    s.conversations[0].title = DEFAULT_TITLE;
    const next = applyPersist(
      s,
      { messages: streamMsgs("hello world"), conversationId: "A" },
      NOW,
    );
    const A = next.conversations.find((c) => c.id === "A")!;
    expect(A.title).not.toBe(DEFAULT_TITLE);
  });
});
