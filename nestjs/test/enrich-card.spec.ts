import { describe, it, expect } from 'bun:test';
import { enrichCard } from '../src/chat/enrich-card';
import type { RetrievedItem } from '../src/chat/system-prompt';

const retrieved: RetrievedItem[] = [
  {
    kind: 'service',
    ref: '42',
    title: 'ทำเว็บแอป',
    summary: 'Next.js + Nest',
  },
  {
    kind: 'project',
    ref: 'mangadock',
    title: 'MangaDock',
    summary: 'AI manga',
  },
];

describe('enrichCard (#69)', () => {
  it('copies title/description from the matching RAG service hit', () => {
    expect(enrichCard({ kind: 'service', id: '42' }, retrieved)).toEqual({
      kind: 'service',
      id: '42',
      title: 'ทำเว็บแอป',
      description: 'Next.js + Nest',
    });
  });

  it('leaves the card unchanged when there is no matching service hit', () => {
    expect(enrichCard({ kind: 'service', id: '99' }, retrieved)).toEqual({
      kind: 'service',
      id: '99',
    });
  });

  it('does not alter project cards', () => {
    expect(enrichCard({ kind: 'project', slug: 'mangadock' }, retrieved)).toEqual(
      { kind: 'project', slug: 'mangadock' },
    );
  });
});
