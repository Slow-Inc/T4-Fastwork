/**
 * Client-side multi-conversation store for /chat (#38, part of the #37 app-shell).
 *
 * There are no user accounts, so conversation history lives in localStorage. This
 * module is pure and framework-agnostic: state transforms take a state value and
 * return a new one; only `loadState`/`saveState` touch a `Storage`, and — like
 * `chat-persist` — every storage path is tolerant (no/broken storage never throws).
 */
import type { PersistedChat } from "./chat-persist";

/** localStorage key holding the whole store. */
export const STORE_KEY = "t4.chat.conversations";

const DEFAULT_TITLE = "บทสนทนาใหม่";

export interface StoredConversation {
  id: string;
  title: string;
  messages: unknown[];
  sessionId?: string;
  updatedAt: number;
}

export interface ConversationState {
  conversations: StoredConversation[];
  activeId: string | null;
  /** True once the legacy `floating` chat has been folded in (idempotency guard). */
  migratedFloating: boolean;
}

export function emptyState(): ConversationState {
  return { conversations: [], activeId: null, migratedFloating: false };
}

// --- storage boundary -------------------------------------------------------

export function loadState(storage: Storage | undefined): ConversationState {
  if (!storage) return emptyState();
  try {
    const raw = storage.getItem(STORE_KEY);
    if (!raw) return emptyState();
    const parsed = JSON.parse(raw) as Partial<ConversationState>;
    return {
      conversations: Array.isArray(parsed?.conversations)
        ? parsed.conversations
        : [],
      activeId: typeof parsed?.activeId === "string" ? parsed.activeId : null,
      migratedFloating: parsed?.migratedFloating === true,
    };
  } catch {
    return emptyState();
  }
}

export function saveState(
  storage: Storage | undefined,
  state: ConversationState,
): void {
  if (!storage) return;
  try {
    storage.setItem(STORE_KEY, JSON.stringify(state));
  } catch {
    // storage full / disabled — persistence is best-effort.
  }
}

// --- CRUD -------------------------------------------------------------------

/** Conversations most-recent first. */
export function listConversations(
  state: ConversationState,
): StoredConversation[] {
  return [...state.conversations].sort((a, b) => b.updatedAt - a.updatedAt);
}

interface CreateOptions {
  id?: string;
  title?: string;
  sessionId?: string;
  messages?: unknown[];
  now?: number;
}

export function createConversation(
  state: ConversationState,
  opts: CreateOptions = {},
): ConversationState {
  const now = opts.now ?? Date.now();
  const conv: StoredConversation = {
    id: opts.id ?? crypto.randomUUID(),
    title: opts.title ?? DEFAULT_TITLE,
    messages: opts.messages ?? [],
    sessionId: opts.sessionId,
    updatedAt: now,
  };
  return {
    ...state,
    conversations: [conv, ...state.conversations],
    activeId: conv.id,
  };
}

export function switchConversation(
  state: ConversationState,
  id: string,
): ConversationState {
  if (!state.conversations.some((c) => c.id === id)) return state;
  return { ...state, activeId: id };
}

export function renameConversation(
  state: ConversationState,
  id: string,
  title: string,
): ConversationState {
  return {
    ...state,
    conversations: state.conversations.map((c) =>
      c.id === id ? { ...c, title } : c,
    ),
  };
}

interface TouchPatch {
  messages?: unknown[];
  sessionId?: string;
  title?: string;
}

export function touchConversation(
  state: ConversationState,
  id: string,
  patch: TouchPatch,
  now: number = Date.now(),
): ConversationState {
  if (!state.conversations.some((c) => c.id === id)) return state;
  return {
    ...state,
    conversations: state.conversations.map((c) =>
      c.id === id ? { ...c, ...patch, updatedAt: now } : c,
    ),
  };
}

export function deleteConversation(
  state: ConversationState,
  id: string,
): ConversationState {
  const conversations = state.conversations.filter((c) => c.id !== id);
  let activeId = state.activeId;
  if (activeId === id) {
    const mostRecent = [...conversations].sort(
      (a, b) => b.updatedAt - a.updatedAt,
    )[0];
    activeId = mostRecent ? mostRecent.id : null;
  }
  return { ...state, conversations, activeId };
}

// --- recency grouping (OWUI buckets) ----------------------------------------

const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

function startOfDay(ts: number): number {
  const d = new Date(ts);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

export interface ConversationGroup {
  label: string;
  conversations: StoredConversation[];
}

/**
 * Group conversations into OWUI-style recency buckets, newest bucket first, most
 * recent conversation first within each. Older-than-30-days fall into `<Month YYYY>`
 * buckets. English labels are canonical; the view layer localizes them.
 */
export function groupByRecency(
  convs: StoredConversation[],
  now: number,
): ConversationGroup[] {
  const order: string[] = [];
  const buckets = new Map<string, StoredConversation[]>();
  const push = (label: string, conv: StoredConversation) => {
    if (!buckets.has(label)) {
      buckets.set(label, []);
      order.push(label);
    }
    buckets.get(label)!.push(conv);
  };

  const todayStart = startOfDay(now);
  for (const conv of [...convs].sort((a, b) => b.updatedAt - a.updatedAt)) {
    const diff = Math.round(
      (todayStart - startOfDay(conv.updatedAt)) / 86_400_000,
    );
    if (diff <= 0) push("Today", conv);
    else if (diff === 1) push("Yesterday", conv);
    else if (diff <= 6) push("Previous 7 Days", conv);
    else if (diff <= 29) push("Previous 30 Days", conv);
    else {
      const d = new Date(conv.updatedAt);
      push(`${MONTHS[d.getMonth()]} ${d.getFullYear()}`, conv);
    }
  }

  return order.map((label) => ({ label, conversations: buckets.get(label)! }));
}

// --- title + migration ------------------------------------------------------

/** First user text run, trimmed; falls back to the default title. Defensive. */
export function deriveTitle(messages: unknown[]): string {
  for (const msg of messages) {
    if (!msg || typeof msg !== "object") continue;
    const m = msg as { role?: unknown; parts?: unknown };
    if (m.role !== "user" || !Array.isArray(m.parts)) continue;
    for (const part of m.parts) {
      if (part && typeof part === "object") {
        const p = part as { type?: unknown; text?: unknown };
        if (p.type === "text" && typeof p.text === "string" && p.text.trim()) {
          return p.text.trim();
        }
      }
    }
  }
  return DEFAULT_TITLE;
}

interface MigrateOptions {
  id?: string;
  now?: number;
}

/**
 * Fold the legacy single `floating` conversation into the store on first load.
 * Idempotent: sets `migratedFloating` and never runs twice. When there is nothing
 * to migrate it still marks the flag so the check is one-time.
 */
export function migrateFloating(
  state: ConversationState,
  legacy: PersistedChat | null,
  opts: MigrateOptions = {},
): ConversationState {
  if (state.migratedFloating) return state;
  if (
    !legacy ||
    !Array.isArray(legacy.messages) ||
    legacy.messages.length === 0
  ) {
    return { ...state, migratedFloating: true };
  }
  const seeded = createConversation(state, {
    id: opts.id,
    now: opts.now,
    title: deriveTitle(legacy.messages),
    sessionId: legacy.sessionId,
    messages: legacy.messages,
  });
  return { ...seeded, migratedFloating: true };
}
