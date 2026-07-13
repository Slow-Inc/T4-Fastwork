/**
 * Persist the floating chat across the panel closing/reopening (which unmounts the
 * ChatClient). Keeps the visible conversation and the backend sessionId, so reopening
 * shows the prior messages and the assistant keeps its memory. Tolerant: any failure
 * (no storage, quota, corrupt data) degrades to "start fresh", never throws.
 */
/**
 * Shared sessionStorage key for the general (non-project) conversation. Used by
 * BOTH the floating popup and the /chat page so history carries across when the
 * user expands the popup into the full page and back (#31).
 */
export const SHARED_CHAT_KEY = 'floating';

export interface PersistedChat {
  messages: unknown[];
  sessionId?: string;
}

export function loadChat(storage: Storage | undefined, key: string): PersistedChat | null {
  if (!storage) return null;
  try {
    const raw = storage.getItem(key);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as PersistedChat;
    if (!parsed || !Array.isArray(parsed.messages) || parsed.messages.length === 0) return null;
    return { messages: parsed.messages, sessionId: parsed.sessionId };
  } catch {
    return null;
  }
}

export function saveChat(storage: Storage | undefined, key: string, data: PersistedChat): void {
  if (!storage) return;
  try {
    storage.setItem(key, JSON.stringify(data));
  } catch {
    // storage full / disabled — persistence is best-effort.
  }
}
