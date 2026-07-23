"use client";

import { ChatClient } from "./chat-client";
import { ChatSessionProvider } from "./chat-session-context";
import { ScopeSummaryPanel } from "./scope-summary-panel";
import { ChatAppShell } from "./chat-app-shell";

/**
 * When arriving at `/chat?project=<slug>` (the "Ask AI about this project" CTA on a
 * project detail page — Requirement §5.4), the page resolves the slug + title
 * server-side from the DB (DB-only) and passes them in.
 *
 * A project-grounded chat stays a fresh, unpersisted single thread (no sidebar) —
 * it matches the floating widget's grounded behaviour. The general conversation
 * gets the full Open WebUI-style app-shell with history (#39).
 */
export function ChatWithProjectContext({
  slug,
  title,
  autoSendProjectQuestion = true,
}: {
  slug?: string;
  title?: string;
  autoSendProjectQuestion?: boolean;
}) {
  if (!slug) return <ChatAppShell />;

  return (
    <ChatSessionProvider>
      <ChatClient
        initialProjectSlug={slug}
        initialProjectTitle={title ?? "ผลงานนี้"}
        autoSendProjectQuestion={autoSendProjectQuestion}
      />
      <ScopeSummaryPanel />
    </ChatSessionProvider>
  );
}
