import { test, expect, describe } from "bun:test";
import {
  appendToken,
  appendCard,
  shouldShowTypingCursor,
  canSendMessage,
  type MessagePart,
} from "./chat-message";

describe("appendToken", () => {
  test("starts a text part when empty", () => {
    expect(appendToken([], "hi")).toEqual([{ type: "text", text: "hi" }]);
  });

  test("merges consecutive tokens into the trailing text part", () => {
    const a = appendToken([], "ทีม ");
    const b = appendToken(a, "T4");
    expect(b).toEqual([{ type: "text", text: "ทีม T4" }]);
  });

  test("starts a new text part after a card", () => {
    const parts: MessagePart[] = [
      { type: "text", text: "ดูงานนี้ " },
      { type: "card", card: { kind: "project", slug: "mangadock" } },
    ];
    const next = appendToken(parts, " ครับ");
    expect(next.length).toBe(3);
    expect(next[2]).toEqual({ type: "text", text: " ครับ" });
  });

  test("does not mutate the input array", () => {
    const parts: MessagePart[] = [{ type: "text", text: "a" }];
    appendToken(parts, "b");
    expect(parts).toEqual([{ type: "text", text: "a" }]);
  });
});

describe("appendCard", () => {
  test("pushes a card part at the current position", () => {
    const parts: MessagePart[] = [{ type: "text", text: "x " }];
    const next = appendCard(parts, { kind: "service", id: "4" });
    expect(next[1]).toEqual({
      type: "card",
      card: { kind: "service", id: "4" },
    });
  });
});

describe("shouldShowTypingCursor", () => {
  test("shows on the last assistant message while streaming", () => {
    expect(shouldShowTypingCursor("assistant", true, "streaming")).toBe(true);
  });

  test("hides once idle", () => {
    expect(shouldShowTypingCursor("assistant", true, "idle")).toBe(false);
  });

  test('hides while only "thinking" (no tokens yet)', () => {
    expect(shouldShowTypingCursor("assistant", true, "thinking")).toBe(false);
  });

  test("hides on user messages", () => {
    expect(shouldShowTypingCursor("user", true, "streaming")).toBe(false);
  });

  test("hides on an assistant message that is not the last one", () => {
    expect(shouldShowTypingCursor("assistant", false, "streaming")).toBe(false);
  });

  test("hides on error", () => {
    expect(shouldShowTypingCursor("assistant", true, "error")).toBe(false);
  });
});

describe("canSendMessage", () => {
  test("can send text when idle", () => {
    expect(canSendMessage(false, "สวัสดี", 0)).toBe(true);
  });

  test("can send with only an attachment (no text)", () => {
    expect(canSendMessage(false, "", 1)).toBe(true);
  });

  test("cannot send an empty message with no attachments", () => {
    expect(canSendMessage(false, "", 0)).toBe(false);
  });

  test("cannot send whitespace-only text with no attachments", () => {
    expect(canSendMessage(false, "   ", 0)).toBe(false);
  });

  // The behaviour change: while the assistant is responding you may keep typing,
  // but sending is blocked until it finishes — even with real text or an image.
  test("cannot send while busy, even with text", () => {
    expect(canSendMessage(true, "ข้อความถัดไป", 0)).toBe(false);
  });

  test("cannot send while busy, even with an attachment", () => {
    expect(canSendMessage(true, "", 2)).toBe(false);
  });
});
