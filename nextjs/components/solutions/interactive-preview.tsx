'use client';

import { useState } from 'react';
import type { PreviewScreen } from '@/content/solution-detail';

type View = 'client' | 'admin';

/**
 * Interactive Preview (Requirement §4.4.1) — lets prospects click through the
 * example screens of a system before hiring. The screen content is shared
 * across the client/admin views (per spec only the mockup differs); the tab
 * switches the framing label.
 */
export function InteractivePreview({ screens }: { screens: PreviewScreen[] }) {
  const [view, setView] = useState<View>('client');
  const [style, setStyle] = useState<1 | 2 | 3>(1);
  const [active, setActive] = useState(0);
  const current = screens[active];

  return (
    <div className="preview">
      <div className="preview-tabs" role="tablist" aria-label="มุมมองตัวอย่างระบบ">
        <button
          role="tab"
          type="button"
          aria-selected={view === 'client'}
          className={`preview-tab${view === 'client' ? ' is-active' : ''}`}
          onClick={() => setView('client')}
        >
          หน้าฝั่งลูกค้า
        </button>
        <button
          role="tab"
          type="button"
          aria-selected={view === 'admin'}
          className={`preview-tab${view === 'admin' ? ' is-active' : ''}`}
          onClick={() => setView('admin')}
        >
          หน้าฝั่ง Admin
        </button>
        <div className="preview-styles" role="group" aria-label="สไตล์">
          {([1, 2, 3] as const).map((s) => (
            <button
              key={s}
              type="button"
              className={`preview-style${style === s ? ' is-active' : ''}`}
              aria-pressed={style === s}
              onClick={() => setStyle(s)}
            >
              สไตล์ {s}
            </button>
          ))}
        </div>
      </div>

      <div className="preview-body">
        <ul className="preview-nav" role="list">
          {screens.map((s, i) => (
            <li key={s.title}>
              <button
                type="button"
                className={`preview-nav-item${i === active ? ' is-active' : ''}`}
                onClick={() => setActive(i)}
              >
                <span className="t-meta">{String(i + 1).padStart(2, '0')}</span>
                {s.title}
              </button>
            </li>
          ))}
        </ul>

        <div className="preview-stage">
          <div className={`preview-mock preview-mock-s${style}`} aria-hidden="true">
            <span className="t-meta">
              {view === 'client' ? 'CLIENT VIEW' : 'ADMIN VIEW'} · สไตล์ {style}
            </span>
            <strong>{current.title}</strong>
          </div>
          <div className="preview-info">
            <h4>{current.title}</h4>
            <p className="t-meta">Role: {current.roles}</p>
            <p className="preview-desc">{current.description}</p>
            <ul className="preview-components">
              {current.components.map((c) => (
                <li key={c}>{c}</li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
