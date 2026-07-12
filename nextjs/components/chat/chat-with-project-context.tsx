'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { projects } from '@/content/catalog';
import { ChatClient } from './chat-client';
import { ChatSessionProvider } from './chat-session-context';
import { ScopeSummaryPanel } from './scope-summary-panel';

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
      <ChatClient initialProjectSlug={slug} initialProjectTitle={title} />
      <ScopeSummaryPanel />
    </ChatSessionProvider>
  );
}

export function ChatWithProjectContext() {
  return (
    <Suspense
      fallback={
        <ChatSessionProvider>
          <ChatClient />
          <ScopeSummaryPanel />
        </ChatSessionProvider>
      }
    >
      <ChatWithProjectContextInner />
    </Suspense>
  );
}
