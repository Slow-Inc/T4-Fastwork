/**
 * A real Vercel `deployment.succeeded` payload carries the deployment's own immutable host
 * (`<project>-<hash>.vercel.app`), never the project's production alias. Every showcase
 * `live_url` is a custom domain, so host equality alone never matched in production and the
 * webhook answered `ignored-unmapped` silently (#204). `deployment.meta` is the exact source.
 */
import { describe, it, expect } from 'bun:test';
import { PgVercelProjectMapper } from '../src/github/pg-vercel-project.mapper';

/** Split a drizzle sql`` template into raw text + bound params. */
function sqlParts(q: unknown): { text: string; params: unknown[] } {
  const text: string[] = [];
  const params: unknown[] = [];
  const walk = (node: unknown): void => {
    if (node == null) return;
    // Bound values sit in queryChunks as bare primitives; only StringChunk carries `value[]`.
    if (typeof node !== 'object') {
      params.push(node);
      return;
    }
    const n = node as { value?: unknown; queryChunks?: unknown[] };
    if (Array.isArray(n.queryChunks)) {
      n.queryChunks.forEach(walk);
      return;
    }
    if (Array.isArray(n.value)) text.push(n.value.join(''));
  };
  walk(q);
  return { text: text.join(' '), params };
}

/**
 * `byRepo` answers the owner/repo lookup; `byHost` answers the live_url scan. Keeping them
 * separate is what proves which strategy resolved a given deployment.
 */
function fakeDb(opts: {
  byRepo?: Array<Record<string, unknown>>;
  byHost?: Array<Record<string, unknown>>;
}) {
  const calls: Array<{ text: string; params: unknown[] }> = [];
  const db = {
    execute: (q: unknown) => {
      const parts = sqlParts(q);
      calls.push(parts);
      if (parts.text.includes('lower(gh_owner)')) {
        return Promise.resolve(opts.byRepo ?? []);
      }
      return Promise.resolve(opts.byHost ?? []);
    },
  };
  return { db, calls };
}

const CUSTOM_DOMAIN_PROJECT = {
  gh_owner: 'Slow-Inc',
  gh_repo: 'Demo',
  live_url: 'https://demo.t4labs.dev',
};

describe('PgVercelProjectMapper (#204)', () => {
  it('resolves from deployment.meta even though the host is a *.vercel.app deployment URL', async () => {
    const { db, calls } = fakeDb({
      byRepo: [{ gh_owner: 'Slow-Inc', gh_repo: 'Demo' }],
      byHost: [CUSTOM_DOMAIN_PROJECT],
    });
    const mapper = new PgVercelProjectMapper(db as never);

    const got = await mapper.resolve({
      url: 'demo-git-master-slow-inc-abc123.vercel.app',
      githubOwner: 'slow-inc',
      githubRepo: 'demo',
    });

    expect(got).toEqual({ owner: 'Slow-Inc', repo: 'Demo' });
    // Resolved by the exact lookup, and the payload values were actually bound to it.
    expect(calls[0].text).toContain('lower(gh_owner)');
    expect(calls[0].params).toContain('slow-inc');
    expect(calls[0].params).toContain('demo');
  });

  it('returns null when the deploy names a repo that is not a published showcase project', async () => {
    const { db } = fakeDb({ byRepo: [], byHost: [CUSTOM_DOMAIN_PROJECT] });
    const mapper = new PgVercelProjectMapper(db as never);

    const got = await mapper.resolve({
      url: 'demo-git-master-slow-inc-abc123.vercel.app',
      githubOwner: 'Slow-Inc',
      githubRepo: 'not-in-showcase',
    });

    expect(got).toBeNull();
  });

  it('falls back to live_url host equality when the payload carries no git metadata', async () => {
    const { db } = fakeDb({ byHost: [CUSTOM_DOMAIN_PROJECT] });
    const mapper = new PgVercelProjectMapper(db as never);

    const got = await mapper.resolve({
      url: 'https://demo.t4labs.dev',
      githubOwner: null,
      githubRepo: null,
    });

    expect(got).toEqual({ owner: 'Slow-Inc', repo: 'Demo' });
  });

  it('returns null when neither metadata nor a usable host is present', async () => {
    const { db } = fakeDb({ byHost: [CUSTOM_DOMAIN_PROJECT] });
    const mapper = new PgVercelProjectMapper(db as never);

    expect(
      await mapper.resolve({ url: null, githubOwner: null, githubRepo: null }),
    ).toBeNull();
  });
});
