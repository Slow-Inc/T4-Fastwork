import type { CardRef } from './marker-parser';
import type { RetrievedItem } from './system-prompt';

/**
 * Attach human labels from the RAG hit onto a service card (#69). Projects are
 * left as slug-only (the client resolves the project card separately).
 */
export function enrichCard(card: CardRef, retrieved: RetrievedItem[]): CardRef {
  if (card.kind !== 'service') return card;
  const item = retrieved.find(
    (candidate) => candidate.kind === 'service' && candidate.ref === card.id,
  );
  return item
    ? { ...card, title: item.title, description: item.summary }
    : card;
}
