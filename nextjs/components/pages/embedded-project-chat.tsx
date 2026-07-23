'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ChatWithProjectContext } from '@/components/chat/chat-with-project-context';

interface Props {
  slug: string;
  title: string;
  en?: boolean;
}

export function EmbeddedProjectChat({ slug, title, en = false }: Props) {
  const [started, setStarted] = useState(false);

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
          {!started && (
            <button
              type="button"
              className="btn"
              onClick={() => setStarted(true)}
            >
              {en ? 'Start asking AI' : 'เริ่มถาม AI'}
            </button>
          )}
          <Link
            href={`/chat?project=${encodeURIComponent(slug)}`}
            className="btn ghost"
          >
            {en ? 'Open full chat' : 'เปิดแชทเต็มหน้า'}
          </Link>
        </div>
      </div>

      {started && (
        <div className="detail-chat__surface">
          <ChatWithProjectContext slug={slug} title={title} />
        </div>
      )}
    </section>
  );
}
