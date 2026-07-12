import { GlobalRegistrator } from '@happy-dom/global-registrator';
import { mock } from 'bun:test';
import React from 'react';

// Registers a DOM (window/document) so @testing-library/react can render.
// Each render test file is responsible for `afterEach(cleanup)` (importing
// testing-library here — before this registration — would misconfigure it).
GlobalRegistrator.register();

// NOTE: this setup reliably renders server/presentational components. Hook-based
// client components (useState/useActionState) can hit "Invalid hook call" from a
// duplicated React copy in the monorepo, so those are covered by extracting and
// unit-testing their pure logic (see lib/sse-parser, lib/chat-message) plus the
// `next build` type/prerender check — not by rendering the client shell here.

// next/link relies on Next's router context (hooks) that doesn't exist in unit
// tests. Mock it to a plain anchor so components using <Link> can be tested.
mock.module('next/link', () => ({
  __esModule: true,
  default: ({
    href,
    children,
    ...rest
  }: {
    href: string | { pathname?: string };
    children: React.ReactNode;
  }) =>
    React.createElement(
      'a',
      { href: typeof href === 'string' ? href : (href?.pathname ?? '#'), ...rest },
      children,
    ),
}));
