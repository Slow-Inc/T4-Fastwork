import Link from 'next/link';
import { services } from '@/content/services';

export type CardData =
  | { kind: 'project'; slug: string; title?: string }
  | { kind: 'service'; id: string };

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

  const svc = services.find((s) => parseInt(s.no, 10) === parseInt(card.id, 10));
  if (!svc) return null;
  return (
    <Link href="/#services" className="chat-card">
      <span className="t-meta">บริการ</span>
      <strong>{svc.title}</strong>
      <span className="chat-card-desc">{svc.description}</span>
    </Link>
  );
}
