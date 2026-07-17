import { describe, it, expect } from "bun:test";
import type { Message } from "./chat-message";
import { reduceAssistant, toPersistable } from "./chat-stream";

const blank = (): Message => ({ role: "assistant", parts: [] });

describe("reduceAssistant", () => {
  it("accumulates reasoning across events", () => {
    let a = blank();
    a = reduceAssistant(a, { kind: "reasoning", text: "think " });
    a = reduceAssistant(a, { kind: "reasoning", text: "more" });
    expect(a.reasoning).toBe("think more");
    expect(a.parts).toEqual([]);
  });

  it("appends a token and stamps reasoningMs once from the reasoning start", () => {
    let a = blank();
    a = reduceAssistant(a, { kind: "token", text: "hi", at: 1000 }, 700);
    expect(a.parts).toEqual([{ type: "text", text: "hi" }]);
    expect(a.reasoningMs).toBe(300);
    // a later token merges text but does NOT overwrite the stamped duration
    a = reduceAssistant(a, { kind: "token", text: "!", at: 5000 }, 700);
    expect(a.parts).toEqual([{ type: "text", text: "hi!" }]);
    expect(a.reasoningMs).toBe(300);
  });

  it("leaves reasoningMs undefined when there was no reasoning phase", () => {
    const a = reduceAssistant(blank(), { kind: "token", text: "x", at: 1000 });
    expect(a.reasoningMs).toBeUndefined();
    expect(a.parts).toEqual([{ type: "text", text: "x" }]);
  });

  it("appends a card as a new part", () => {
    const card = { title: "T" } as never;
    const a = reduceAssistant(blank(), { kind: "card", card });
    expect(a.parts).toEqual([{ type: "card", card }]);
  });

  it("appends error fallback text as a token", () => {
    const a = reduceAssistant(blank(), { kind: "error", text: "ขออภัย" });
    expect(a.parts).toEqual([{ type: "text", text: "ขออภัย" }]);
  });

  it("does not mutate the input message (loop-owned accumulator stays safe)", () => {
    const a = blank();
    const b = reduceAssistant(a, { kind: "token", text: "z", at: 1 });
    expect(a.parts).toEqual([]);
    expect(b).not.toBe(a);
  });
});

describe("toPersistable", () => {
  it("strips inline base64 images from every turn", () => {
    const msgs: Message[] = [
      { role: "user", parts: [{ type: "text", text: "hi" }], images: ["data:...."] },
      { role: "assistant", parts: [{ type: "text", text: "hello" }] },
    ];
    const out = toPersistable(msgs);
    expect(out[0].images).toBeUndefined();
    expect(out[0].parts).toEqual([{ type: "text", text: "hi" }]);
    expect(out[1]).toBe(msgs[1]); // imageless turn passes through unchanged
  });
});
