"use client";

import { useEffect, useRef, useState } from "react";
import {
  applyPersist,
  createConversation,
  deleteConversation,
  groupByRecency,
  listConversations,
  loadState,
  migrateFloating,
  renameConversation,
  saveState,
  switchConversation,
  type ConversationState,
} from "@/lib/chat-conversations";
import { SHARED_CHAT_KEY, loadChat, saveChat } from "@/lib/chat-persist";
import { ChatClient, type Message } from "./chat-client";
import { ChatSessionProvider } from "./chat-session-context";
import { ScopeSummaryPanel } from "./scope-summary-panel";
import { ChatSidebar } from "./chat-sidebar";

/**
 * The /chat app-shell (#39): an Open WebUI-style two-pane layout — a collapsible
 * conversation-history sidebar beside the chat pane — over the client-side
 * conversation store (#38). No accounts, so history lives in localStorage; the
 * legacy single `floating` conversation is migrated in on first mount, and the
 * active conversation is mirrored back to `floating` so the compact popup widget
 * (which still reads that key) stays continuous with the page (#31).
 */
export function ChatAppShell() {
  const [state, setState] = useState<ConversationState | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  // Timestamp for the sidebar's relative stamps + grouping. Sampled once on mount
  // (not per render — that would be an impure render) which is plenty fresh: the
  // buckets and "3h" labels don't need to tick live, matching Open WebUI.
  const [now, setNow] = useState(0);
  // Latest active id in a ref so a background stream's persist (which may run
  // through a handler captured before a conversation switch) can tell whether it
  // targets the on-screen conversation before mirroring to the popup (#73).
  const activeIdRef = useRef<string | null>(null);
  useEffect(() => {
    activeIdRef.current = state?.activeId ?? null;
  });

  // Load the store client-only (localStorage), fold in the floating conversation,
  // and guarantee an active conversation. This MUST run after mount: localStorage
  // is SSR-unsafe, and a lazy useState initializer would run on the server and then
  // mismatch on hydration. The one skeleton→loaded transition is intentional, so
  // the setState-in-effect warnings below are suppressed deliberately.
  useEffect(() => {
    let s = loadState(window.localStorage);
    s = migrateFloating(s, loadChat(window.sessionStorage, SHARED_CHAT_KEY));
    if (s.conversations.length === 0) s = createConversation(s);
    if (!s.activeId) s = switchConversation(s, listConversations(s)[0].id);
    saveState(window.localStorage, s);
    /* eslint-disable react-hooks/set-state-in-effect */
    setState(s);
    setSidebarOpen(window.innerWidth >= 820);
    setNow(Date.now());
    /* eslint-enable react-hooks/set-state-in-effect */
  }, []);

  function handleNewChat() {
    setState((prev) => {
      if (!prev) return prev;
      const next = createConversation(prev);
      saveState(window.localStorage, next);
      return next;
    });
  }

  function handleSelect(id: string) {
    setState((prev) => {
      if (!prev) return prev;
      const next = switchConversation(prev, id);
      saveState(window.localStorage, next);
      return next;
    });
    if (window.innerWidth < 820) setSidebarOpen(false);
  }

  function handleRename(id: string, title: string) {
    setState((prev) => {
      if (!prev) return prev;
      const next = renameConversation(prev, id, title);
      saveState(window.localStorage, next);
      return next;
    });
  }

  function handleDelete(id: string) {
    setState((prev) => {
      if (!prev) return prev;
      let next = deleteConversation(prev, id);
      if (next.conversations.length === 0) next = createConversation(next);
      saveState(window.localStorage, next);
      return next;
    });
  }

  function handlePersist(data: {
    messages: Message[];
    sessionId?: string;
    conversationId?: string;
  }) {
    setState((prev) => {
      if (!prev) return prev;
      // Target the conversation the stream ORIGINATED in, not whatever is active
      // now — a reply still arriving after a switch must not overwrite the new
      // conversation (#73). applyPersist also names a still-default conversation.
      const next = applyPersist(prev, data);
      saveState(window.localStorage, next);
      return next;
    });
    // Mirror to the popup widget ONLY for the on-screen conversation (#31): a
    // background stream targeting another conversation must not overwrite the
    // popup's shared view (#73).
    if (!data.conversationId || data.conversationId === activeIdRef.current) {
      saveChat(window.sessionStorage, SHARED_CHAT_KEY, {
        messages: data.messages,
        sessionId: data.sessionId,
      });
    }
  }

  // Stable frame before the store loads (also the SSR/hydration render). The page's
  // <h1> lives outside the shell, so SEO is unaffected.
  if (!state) return <div className="chat-shell" aria-busy="true" />;

  const active = state.conversations.find((c) => c.id === state.activeId);
  const groups = groupByRecency(state.conversations, now);

  return (
    <ChatSessionProvider>
      <div className={`chat-shell${sidebarOpen ? "" : " is-collapsed"}`}>
        <ChatSidebar
          groups={groups}
          activeId={state.activeId}
          now={now}
          onNewChat={handleNewChat}
          onSelect={handleSelect}
          onRename={handleRename}
          onDelete={handleDelete}
          onClose={() => setSidebarOpen(false)}
        />
        <div
          className="chat-scrim"
          role="presentation"
          onClick={() => setSidebarOpen(false)}
        />
        <div className="chat-pane">
          {/* Slim identity strip (#43) — OWUI's top bar without the model selector. */}
          <div className="chat-topstrip">
            {!sidebarOpen && (
              <button
                type="button"
                className="chat-open-sidebar"
                onClick={() => setSidebarOpen(true)}
                aria-label="เปิดแถบประวัติ"
              >
                <PanelIcon />
                ประวัติ
              </button>
            )}
            <span className="chat-topstrip-id">ผู้ช่วย AI</span>
            <span className="chat-topstrip-sep" aria-hidden="true">
              ·
            </span>
            <span className="chat-topstrip-org">T4 Labs</span>
          </div>
          <ChatClient
            key={state.activeId ?? "none"}
            conversationId={state.activeId ?? undefined}
            emptyState
            initialMessages={
              active && active.messages.length
                ? (active.messages as Message[])
                : undefined
            }
            initialSessionId={active?.sessionId}
            onPersist={handlePersist}
          />
          <ScopeSummaryPanel />
        </div>
      </div>
    </ChatSessionProvider>
  );
}

function PanelIcon() {
  return (
    <svg
      width="15"
      height="15"
      viewBox="0 0 16 16"
      fill="none"
      aria-hidden="true"
    >
      <rect
        x="2"
        y="2.5"
        width="12"
        height="11"
        rx="1.5"
        stroke="currentColor"
        strokeWidth="1.3"
      />
      <path d="M6 2.5v11" stroke="currentColor" strokeWidth="1.3" />
    </svg>
  );
}
