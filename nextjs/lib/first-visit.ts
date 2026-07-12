/** First-visit AI greeting popup flag (Requirement §5.4 / FR-01). */
export interface StorageLike {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
}

const KEY = 't4labs_ai_greeting_seen';

export function hasSeenGreeting(storage: StorageLike): boolean {
  return storage.getItem(KEY) === '1';
}

export function markGreetingSeen(storage: StorageLike): void {
  storage.setItem(KEY, '1');
}
