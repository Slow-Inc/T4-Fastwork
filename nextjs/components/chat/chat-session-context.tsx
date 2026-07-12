'use client';

import { createContext, useCallback, useContext, useState, type ReactNode } from 'react';

interface ChatSessionApi {
  sessionId?: string;
  turnCount: number;
  reportSession(id: string): void;
  reportTurnComplete(): void;
}

const NOOP: ChatSessionApi = {
  sessionId: undefined,
  turnCount: 0,
  reportSession: () => {},
  reportTurnComplete: () => {},
};

const ChatSessionContext = createContext<ChatSessionApi | null>(null);

/**
 * Publishes the active chat sessionId + turn count so sibling components
 * (e.g. ScopeSummaryPanel) can react without prop-drilling through ChatClient,
 * which is also reused as the floating widget on every page (§5.4 / FR-08).
 */
export function ChatSessionProvider({ children }: { children: ReactNode }) {
  const [sessionId, setSessionId] = useState<string>();
  const [turnCount, setTurnCount] = useState(0);

  const reportSession = useCallback((id: string) => setSessionId(id), []);
  const reportTurnComplete = useCallback(() => setTurnCount((c) => c + 1), []);

  return (
    <ChatSessionContext.Provider
      value={{ sessionId, turnCount, reportSession, reportTurnComplete }}
    >
      {children}
    </ChatSessionContext.Provider>
  );
}

/** Safe to call outside a provider (e.g. the floating widget) — becomes a no-op. */
export function useChatSession(): ChatSessionApi {
  return useContext(ChatSessionContext) ?? NOOP;
}
