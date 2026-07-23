'use client';

import Link from 'next/link';
import dynamic from 'next/dynamic';

const ChatWithProjectContext = dynamic(
  () =>
    import('@/components/chat/chat-with-project-context').then(
      (mod) => mod.ChatWithProjectContext,
    ),
  {
    loading: () => (
      <p className="detail-chat__loading" role="status">
        กำลังโหลดแชท / Loading chat…
      </p>
    ),
  },
);

interface Props {
  slug: string;
  title: string;
  en?: boolean;
}

export function EmbeddedProjectChat({ slug, title, en = false }: Props) {
  return (
    <section className="detail-chat rv" aria-labelledby="detail-chat-title">
      <div className="detail-chat__head">
        <div>
          <span className="t-idx">Project AI</span>
          <h2 id="detail-chat-title">
            {en ? `Ask AI about ${title}` : `ถาม AI เกี่ยวกับ ${title}`}
          </h2>
          <p>
            {en
              ? 'Ask about this project’s approach, technology, or fit for your idea.'
              : 'ถามแนวทาง เทคโนโลยี หรือความเหมาะสมของโปรเจกต์นี้กับไอเดียของคุณ'}
          </p>
        </div>
        <div className="detail-chat__actions">
          <Link
            href={`/chat?project=${encodeURIComponent(slug)}`}
            className="btn ghost"
          >
            {en ? 'Open full chat' : 'เปิดแชทเต็มหน้า'}
          </Link>
        </div>
      </div>

      <div
        className="detail-chat__surface"
        role="region"
        aria-label={en ? `AI chat about ${title}` : `แชท AI เกี่ยวกับ ${title}`}
      >
        <ChatWithProjectContext
          slug={slug}
          title={title}
          autoSendProjectQuestion={false}
        />
      </div>
    </section>
  );
}
