import { describe, it, expect } from 'bun:test';
import {
  keysForMember,
  keysForRepo,
  matchesWatched,
  subscribeSnapshots,
  tagForKey,
  type RealtimeClientLike,
} from './live-snapshot';

describe('tagForKey — maps a snapshot key to the Next fetch cache tag to bust', () => {
  it('member repos / profile / readme all map to the per-login tag', () => {
    // Mirrors the `tags: ['gh:<login>']` on getMemberLiveRepos/getMemberLiveUser.
    expect(tagForKey('repos:xenodeve')).toBe('gh:xenodeve');
    expect(tagForKey('user:xenodeve')).toBe('gh:xenodeve');
    expect(tagForKey('user:xenodeve:readme')).toBe('gh:xenodeve');
  });

  it('repo-detail keys map to the per-repo tag', () => {
    // Mirrors the `tags: ['gh:<owner>/<repo>']` on getRepoDetail.
    expect(tagForKey('repo:Slow-Inc/MangaDock:contributors')).toBe(
      'gh:Slow-Inc/MangaDock',
    );
    expect(tagForKey('repo:Slow-Inc/MangaDock:readme')).toBe(
      'gh:Slow-Inc/MangaDock',
    );
  });

  it('returns null for unknown / non-tag keys (so nothing unexpected is busted)', () => {
    expect(tagForKey('delivery:abc')).toBeNull();
    expect(tagForKey('org:Slow-Inc')).toBeNull(); // org list is not a per-surface tag
    expect(tagForKey('user:foo/bar')).toBeNull();
    expect(tagForKey('')).toBeNull();
  });
});

describe('keysForMember / keysForRepo — the snapshot keys a live surface watches', () => {
  it('a member page watches repos + profile + profile-readme', () => {
    expect(keysForMember('xenodeve')).toEqual([
      'repos:xenodeve',
      'user:xenodeve',
      'user:xenodeve:readme',
    ]);
  });

  it('a repo detail page watches contributors + pulls + readme', () => {
    expect(keysForRepo('Slow-Inc', 'MangaDock')).toEqual([
      'repo:Slow-Inc/MangaDock:contributors',
      'repo:Slow-Inc/MangaDock:pulls',
      'repo:Slow-Inc/MangaDock:readme',
    ]);
  });
});

describe('matchesWatched — client-side filter of a broadcast row', () => {
  it('is true only when the changed row key is one this surface watches', () => {
    const watched = ['repos:xenodeve', 'user:xenodeve'];
    expect(matchesWatched('repos:xenodeve', watched)).toBe(true);
    expect(matchesWatched('user:slowgers', watched)).toBe(false);
    expect(matchesWatched(undefined, watched)).toBe(false);
    expect(matchesWatched('repos:xenodeve', [])).toBe(false);
  });
});

describe('subscribeSnapshots — wires a Realtime channel and fires onHit for watched keys', () => {
  function fakeClient() {
    const calls = {
      channelName: '' as string,
      on: null as null | { event: string; cfg: Record<string, unknown> },
      subscribed: false,
      removed: [] as unknown[],
    };
    let handler: (payload: { new?: { key?: string } }) => void = () => {};
    const channel = {
      on(event: string, cfg: Record<string, unknown>, cb: typeof handler) {
        calls.on = { event, cfg };
        handler = cb;
        return channel;
      },
      subscribe() {
        calls.subscribed = true;
        return channel;
      },
    };
    const client: RealtimeClientLike = {
      channel: (name: string) => {
        calls.channelName = name;
        return channel as unknown as ReturnType<RealtimeClientLike['channel']>;
      },
      removeChannel: (ch: unknown) => {
        calls.removed.push(ch);
      },
    };
    return { client, calls, emit: (key?: string) => handler({ new: { key } }) };
  }

  it('subscribes to github_snapshots changes and returns an unsubscribe', () => {
    const { client, calls } = fakeClient();
    const off = subscribeSnapshots(client, ['repos:xenodeve'], () => {});

    expect(calls.on?.event).toBe('postgres_changes');
    expect(calls.on?.cfg).toMatchObject({
      schema: 'public',
      table: 'github_snapshots',
    });
    expect(calls.subscribed).toBe(true);

    off();
    expect(calls.removed.length).toBe(1);
  });

  it('invokes onHit only for a watched key, not for others', () => {
    const { client, emit } = fakeClient();
    const hits: string[] = [];
    subscribeSnapshots(client, ['repos:xenodeve'], (key) => hits.push(key));

    emit('user:slowgers'); // not watched
    emit('repos:xenodeve'); // watched
    emit(undefined); // malformed

    expect(hits).toEqual(['repos:xenodeve']);
  });
});
