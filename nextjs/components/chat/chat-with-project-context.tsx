'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { projects } from '@/content/catalog';
import { ChatClient } from './chat-client';
import { ChatSessionProvider } from './chat-session-context';
import { ScopeSummaryPanel } from './scope-summary-panel';
import { SHARED_CHAT_KEY } from '@/lib/chat-persist';

/**
 * Reads `?project=<slug>` (set by the "Ask AI about this project" CTA on a
 * project detail page — Requirement §5.4) via the client-only useSearchParams
 * hook, wrapped in Suspense, so /chat itself stays statically rendered.
 */
function ChatWithProjectContextInner() {
  const searchParams = useSearchParams();
  const slug = searchParams.get('project') ?? undefined;
  // Best-effort title from the static catalog; the backend still grounds
  // fully by slug even for DB-only projects the catalog doesn't know about.
  const knownTitle = slug ? projects.find((p) => p.slug === slug)?.title : undefined;
  const title = slug ? (knownTitle ?? 'ผลงานนี้') : undefined;

  return (
    <ChatSessionProvider>
      {/* General conversation shares the floating popup's history (#31); a
          project-grounded chat stays a fresh, unpersisted thread (matches the
          floating widget, which also skips persistence when grounded). */}
      <ChatClient
        initialProjectSlug={slug}
        initialProjectTitle={title}
        persistKey={slug ? undefined : SHARED_CHAT_KEY}
      />
      <ScopeSummaryPanel />
    </ChatSessionProvider>
  );
}

export function ChatWithProjectContext() {
  return (
    <Suspense
      fallback={
        <ChatSessionProvider>
          <ChatClient persistKey={SHARED_CHAT_KEY} />
          <ScopeSummaryPanel />
        </ChatSessionProvider>
      }
    >
      <ChatWithProjectContextInner />
    </Suspense>
  );
}
