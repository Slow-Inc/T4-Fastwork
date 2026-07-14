import { describe, it, expect } from "bun:test";
import {
  emptyState,
  loadState,
  saveState,
  listConversations,
  createConversation,
  switchConversation,
  renameConversation,
  deleteConversation,
  touchConversation,
  groupByRecency,
  migrateFloating,
  deriveTitle,
  STORE_KEY,
} from "./chat-conversations";
import type { PersistedChat } from "./chat-persist";

/** Minimal in-memory Storage stand-in (same shape as chat-persist.test.ts). */
function fakeStorage(seed: Record<string, string> = {}): Storage {
  const map = new Map(Object.entries(seed));
  return {
    getItem: (k) => map.get(k) ?? null,
    setItem: (k, v) => void map.set(k, v),
    removeItem: (k) => void map.delete(k),
    clear: () => map.clear(),
    key: (i) => [...map.keys()][i] ?? null,
    get length() {
      return map.size;
    },
  } as Storage;
}

/** Anchor "now" at a fixed local noon so whole-day offsets land cleanly in buckets. */
const NOW = new Date(2026, 5, 15, 12, 0, 0).getTime(); // 2026-06-15 12:00 local
const DAY = 86_400_000;
const daysAgo = (n: number) => NOW - n * DAY;

describe("chat-conversations — CRUD", () => {
  it("creates a conversation and makes it active", () => {
    const s = createConversation(emptyState(), { id: "c1", now: NOW });
    expect(s.conversations).toHaveLength(1);
    expect(s.conversations[0].id).toBe("c1");
    expect(s.conversations[0].messages).toEqual([]);
    expect(s.conversations[0].updatedAt).toBe(NOW);
    expect(s.activeId).toBe("c1");
  });

  it("lists conversations most-recent first", () => {
    let s = createConversation(emptyState(), { id: "a", now: daysAgo(3) });
    s = createConversation(s, { id: "b", now: daysAgo(1) });
    s = createConversation(s, { id: "c", now: daysAgo(2) });
    expect(listConversations(s).map((c) => c.id)).toEqual(["b", "c", "a"]);
  });

  it("switches the active conversation", () => {
    let s = createConversation(emptyState(), { id: "a", now: NOW });
    s = createConversation(s, { id: "b", now: NOW });
    s = switchConversation(s, "a");
    expect(s.activeId).toBe("a");
  });

  it("ignores a switch to an unknown id", () => {
    const s = createConversation(emptyState(), { id: "a", now: NOW });
    expect(switchConversation(s, "nope").activeId).toBe("a");
  });

  it("renames a conversation", () => {
    let s = createConversation(emptyState(), { id: "a", now: NOW });
    s = renameConversation(s, "a", "โปรเจกต์ใหม่");
    expect(s.conversations[0].title).toBe("โปรเจกต์ใหม่");
  });

  it("touches a conversation: updates messages/sessionId and bumps updatedAt", () => {
    let s = createConversation(emptyState(), { id: "a", now: daysAgo(5) });
    s = touchConversation(
      s,
      "a",
      { messages: [{ role: "user", parts: [] }], sessionId: "sess-9" },
      NOW,
    );
    expect(s.conversations[0].messages).toHaveLength(1);
    expect(s.conversations[0].sessionId).toBe("sess-9");
    expect(s.conversations[0].updatedAt).toBe(NOW);
  });

  it("deletes a conversation and re-points active to the most recent remaining", () => {
    let s = createConversation(emptyState(), { id: "a", now: daysAgo(3) });
    s = createConversation(s, { id: "b", now: daysAgo(1) });
    s = createConversation(s, { id: "c", now: daysAgo(2) });
    s = switchConversation(s, "a");
    s = deleteConversation(s, "a");
    expect(s.conversations.map((c) => c.id).sort()).toEqual(["b", "c"]);
    expect(s.activeId).toBe("b"); // most recent remaining
  });

  it("deleting the last conversation leaves no active id", () => {
    let s = createConversation(emptyState(), { id: "a", now: NOW });
    s = deleteConversation(s, "a");
    expect(s.conversations).toHaveLength(0);
    expect(s.activeId).toBeNull();
  });
});

describe("chat-conversations — groupByRecency", () => {
  const conv = (id: string, when: number) => ({
    id,
    title: id,
    messages: [],
    updatedAt: when,
  });

  it("buckets by OWUI recency windows", () => {
    const convs = [
      conv("today", daysAgo(0)),
      conv("yst", daysAgo(1)),
      conv("wk", daysAgo(3)),
      conv("mo", daysAgo(10)),
      conv("old", daysAgo(60)),
    ];
    const groups = groupByRecency(convs, NOW);
    const byLabel = Object.fromEntries(
      groups.map((g) => [g.label, g.conversations.map((c) => c.id)]),
    );
    expect(byLabel["Today"]).toEqual(["today"]);
    expect(byLabel["Yesterday"]).toEqual(["yst"]);
    expect(byLabel["Previous 7 Days"]).toEqual(["wk"]);
    expect(byLabel["Previous 30 Days"]).toEqual(["mo"]);
    expect(byLabel["April 2026"]).toEqual(["old"]); // ~2026-04-16
  });

  it("orders groups newest-first and omits empty buckets", () => {
    const groups = groupByRecency(
      [conv("a", daysAgo(0)), conv("b", daysAgo(10))],
      NOW,
    );
    expect(groups.map((g) => g.label)).toEqual(["Today", "Previous 30 Days"]);
  });

  it("sorts within a bucket most-recent first", () => {
    const groups = groupByRecency(
      [conv("older", daysAgo(5)), conv("newer", daysAgo(2))],
      NOW,
    );
    expect(groups[0].conversations.map((c) => c.id)).toEqual([
      "newer",
      "older",
    ]);
  });

  it("returns no groups for an empty list", () => {
    expect(groupByRecency([], NOW)).toEqual([]);
  });
});

describe("chat-conversations — deriveTitle", () => {
  it("uses the first user text run, trimmed", () => {
    const messages = [
      {
        role: "user",
        parts: [{ type: "text", text: "สวัสดีครับ ช่วยแนะนำโปรเจกต์หน่อย" }],
      },
      { role: "assistant", parts: [{ type: "text", text: "ได้เลย" }] },
    ];
    expect(deriveTitle(messages)).toBe("สวัสดีครับ ช่วยแนะนำโปรเจกต์หน่อย");
  });

  it("falls back to a default when there is no user text", () => {
    expect(deriveTitle([])).toBe("บทสนทนาใหม่");
    expect(
      deriveTitle([
        { role: "assistant", parts: [{ type: "text", text: "hi" }] },
      ]),
    ).toBe("บทสนทนาใหม่");
  });

  it("is defensive against malformed messages", () => {
    expect(() =>
      deriveTitle([null, {}, { role: "user" }] as unknown[]),
    ).not.toThrow();
    expect(deriveTitle([null, {}, { role: "user" }] as unknown[])).toBe(
      "บทสนทนาใหม่",
    );
  });
});

describe("chat-conversations — migrateFloating", () => {
  const legacy: PersistedChat = {
    messages: [{ role: "user", parts: [{ type: "text", text: "เดิม" }] }],
    sessionId: "floating-sess",
  };

  it("seeds a conversation from the floating chat and marks it migrated", () => {
    const s = migrateFloating(emptyState(), legacy, { id: "mig", now: NOW });
    expect(s.migratedFloating).toBe(true);
    expect(s.conversations).toHaveLength(1);
    expect(s.conversations[0].sessionId).toBe("floating-sess");
    expect(s.conversations[0].messages).toHaveLength(1);
    expect(s.conversations[0].title).toBe("เดิม");
    expect(s.activeId).toBe("mig");
  });

  it("is idempotent — a second run adds nothing", () => {
    const once = migrateFloating(emptyState(), legacy, { id: "mig", now: NOW });
    const twice = migrateFloating(once, legacy, { id: "mig2", now: NOW });
    expect(twice.conversations).toHaveLength(1);
    expect(twice.migratedFloating).toBe(true);
  });

  it("marks migrated even when there is no floating chat (nothing to seed)", () => {
    const s = migrateFloating(emptyState(), null, { now: NOW });
    expect(s.conversations).toHaveLength(0);
    expect(s.migratedFloating).toBe(true);
  });
});

describe("chat-conversations — storage boundary", () => {
  it("round-trips state through storage", () => {
    const store = fakeStorage();
    const s = createConversation(emptyState(), { id: "a", now: NOW });
    saveState(store, s);
    expect(loadState(store)).toEqual(s);
    expect(store.getItem(STORE_KEY)).toBeTruthy();
  });

  it("returns an empty state when nothing is stored", () => {
    expect(loadState(fakeStorage())).toEqual(emptyState());
  });

  it("is tolerant of corrupt JSON", () => {
    const store = fakeStorage({ [STORE_KEY]: "{not json" });
    expect(loadState(store)).toEqual(emptyState());
  });

  it("no-ops without a storage (SSR)", () => {
    expect(loadState(undefined)).toEqual(emptyState());
    expect(() => saveState(undefined, emptyState())).not.toThrow();
  });

  it("never throws when the store is malformed but parseable", () => {
    const store = fakeStorage({
      [STORE_KEY]: JSON.stringify({ conversations: "nope" }),
    });
    expect(() => loadState(store)).not.toThrow();
    expect(loadState(store).conversations).toEqual([]);
  });
});
