"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { projects } from "@/content/catalog";
import { ChatClient } from "./chat-client";
import { ChatSessionProvider } from "./chat-session-context";
import { ScopeSummaryPanel } from "./scope-summary-panel";
import { ChatAppShell } from "./chat-app-shell";

/**
 * Reads `?project=<slug>` (set by the "Ask AI about this project" CTA on a
 * project detail page — Requirement §5.4) via the client-only useSearchParams
 * hook, wrapped in Suspense, so /chat itself stays statically rendered.
 *
 * A project-grounded chat stays a fresh, unpersisted single thread (no sidebar) —
 * it matches the floating widget's grounded behaviour. The general conversation
 * gets the full Open WebUI-style app-shell with history (#39).
 */
function ChatWithProjectContextInner() {
  const searchParams = useSearchParams();
  const slug = searchParams.get("project") ?? undefined;
  // Best-effort title from the static catalog; the backend still grounds
  // fully by slug even for DB-only projects the catalog doesn't know about.
  const knownTitle = slug
    ? projects.find((p) => p.slug === slug)?.title
    : undefined;
  const title = slug ? (knownTitle ?? "ผลงานนี้") : undefined;

  if (!slug) return <ChatAppShell />;

  return (
    <ChatSessionProvider>
      <ChatClient initialProjectSlug={slug} initialProjectTitle={title} />
      <ScopeSummaryPanel />
    </ChatSessionProvider>
  );
}

export function ChatWithProjectContext() {
  return (
    <Suspense fallback={<div className="chat-shell" aria-busy="true" />}>
      <ChatWithProjectContextInner />
    </Suspense>
  );
}
