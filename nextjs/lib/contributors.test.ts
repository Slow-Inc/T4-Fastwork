import { describe, it, expect } from 'bun:test';
import {
  classifyContributors,
  type RawContributor,
  type RawPull,
  type RosterMember,
} from './contributors';

const roster: RosterMember[] = [
  { slug: 'xenodev', githubUrl: 'https://github.com/xenodeve' },
  { slug: 'akkanop', githubUrl: 'https://github.com/akkanop-x' },
  { slug: 'nogh' }, // member without a github url
];

function contrib(over: Partial<RawContributor> = {}): RawContributor {
  return {
    login: 'xenodeve',
    avatar_url: 'http://a/x.png',
    html_url: 'https://github.com/xenodeve',
    contributions: 10,
    ...over,
  };
}

describe('classifyContributors', () => {
  it('marks roster members as team (with slug) and others as external', () => {
    const out = classifyContributors(
      [contrib({ login: 'xenodeve', contributions: 10 }), contrib({ login: 'outsider', contributions: 3 })],
      [],
      roster,
    );
    const xeno = out.find((c) => c.login === 'xenodeve')!;
    const out2 = out.find((c) => c.login === 'outsider')!;
    expect(xeno.membership).toBe('team');
    expect(xeno.teamSlug).toBe('xenodev');
    expect(out2.membership).toBe('external');
    expect(out2.teamSlug).toBeUndefined();
  });

  it('adds open-PR authors as pending when not already merged', () => {
    const pulls: RawPull[] = [
      { user: { login: 'newcontributor', avatar_url: 'http://a/n.png', html_url: 'https://github.com/newcontributor' } },
      { user: { login: 'xenodeve', avatar_url: 'http://a/x.png', html_url: 'https://github.com/xenodeve' } }, // already merged → not duplicated
    ];
    const out = classifyContributors([contrib({ login: 'xenodeve' })], pulls, roster);

    const pending = out.filter((c) => c.status === 'pending');
    expect(pending.map((c) => c.login)).toEqual(['newcontributor']);
    // xenodeve stays a single merged entry
    expect(out.filter((c) => c.login === 'xenodeve')).toHaveLength(1);
    expect(out.find((c) => c.login === 'xenodeve')!.status).toBe('merged');
  });

  it('sorts merged (by contributions desc) before pending', () => {
    const out = classifyContributors(
      [contrib({ login: 'a', contributions: 2 }), contrib({ login: 'b', contributions: 9 })],
      [{ user: { login: 'p', avatar_url: '', html_url: '' } }],
      roster,
    );
    expect(out.map((c) => c.login)).toEqual(['b', 'a', 'p']);
    expect(out.map((c) => c.status)).toEqual(['merged', 'merged', 'pending']);
  });

  it('ignores pulls with a null author', () => {
    const out = classifyContributors([], [{ user: null }], roster);
    expect(out).toHaveLength(0);
  });
});
