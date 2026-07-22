import Link from 'next/link';

export type CardData =
  | { kind: 'project'; slug: string; title?: string }
  | { kind: 'service'; id: string; title?: string; description?: string };

/** Renders a project/service card injected mid-stream (docs/api/chat.md). Projects
 * are DB-only, so a client-rendered card labels itself from the marker's own
 * title/slug (no static catalog lookup); the link always resolves to the DB detail. */
export function InlineCard({ card }: { card: CardData }) {
  if (card.kind === 'project') {
    return (
      <Link href={`/projects/${card.slug}`} className="chat-card">
        <span className="t-meta">ผลงาน</span>
        <strong>{card.title ?? card.slug}</strong>
      </Link>
    );
  }

  return (
    <Link href="/#services" className="chat-card">
      <span className="t-meta">บริการ</span>
      <strong>{card.title ?? card.id}</strong>
      {card.description ? <span className="chat-card-desc">{card.description}</span> : null}
    </Link>
  );
}
