import Link from 'next/link';
import { getProject } from '@/content/catalog';
import { services } from '@/content/services';

export type CardData =
  | { kind: 'project'; slug: string }
  | { kind: 'service'; id: string };

/** Renders a project/service card injected mid-stream (docs/api/chat.md). */
export function InlineCard({ card }: { card: CardData }) {
  if (card.kind === 'project') {
    const p = getProject(card.slug);
    if (!p) return null;
    return (
      <Link href={`/projects/${p.slug}`} className="chat-card">
        <span className="t-meta">ผลงาน</span>
        <strong>{p.title}</strong>
        <span className="chat-card-desc">{p.description}</span>
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
