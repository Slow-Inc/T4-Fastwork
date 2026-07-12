'use client';

import {
  createContext,
  useCallback,
  useContext,
  useRef,
  useState,
  type ReactNode,
} from 'react';

export interface FloatingChatRequest {
  projectSlug?: string;
  projectTitle?: string;
  /** Bumped on every request so ChatButton can force-remount ChatClient — even
   * re-asking about the same project starts a fresh grounded conversation. */
  nonce: number;
}

interface FloatingChatApi {
  request: FloatingChatRequest | null;
  openChat(projectSlug?: string, projectTitle?: string): void;
}

const FloatingChatContext = createContext<FloatingChatApi | null>(null);

const NOOP: FloatingChatApi = { request: null, openChat: () => {} };

/**
 * Lets a page (e.g. a project detail page) open the floating ChatButton
 * widget pre-loaded with project context, instead of navigating away to the
 * full /chat page (Requirement §5.5 / FR-09).
 */
export function FloatingChatProvider({ children }: { children: ReactNode }) {
  const [request, setRequest] = useState<FloatingChatRequest | null>(null);
  const nonceRef = useRef(0);

  const openChat = useCallback((projectSlug?: string, projectTitle?: string) => {
    nonceRef.current += 1;
    setRequest({ projectSlug, projectTitle, nonce: nonceRef.current });
  }, []);

  return (
    <FloatingChatContext.Provider value={{ request, openChat }}>
      {children}
    </FloatingChatContext.Provider>
  );
}

/** Safe to call without a provider (most pages) — becomes a no-op. */
export function useFloatingChat(): FloatingChatApi {
  return useContext(FloatingChatContext) ?? NOOP;
}
