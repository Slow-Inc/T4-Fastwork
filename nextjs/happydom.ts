import { GlobalRegistrator } from '@happy-dom/global-registrator';
import { mock } from 'bun:test';
import React from 'react';

// Registers a DOM (window/document) so @testing-library/react can render.
GlobalRegistrator.register();

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
