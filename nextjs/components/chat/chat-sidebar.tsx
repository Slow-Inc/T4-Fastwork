"use client";

import { useState } from "react";
import type { ConversationGroup } from "@/lib/chat-conversations";
import { formatRelativeTime } from "@/lib/chat-relative-time";

/** Store labels are English canonical (Today / Yesterday / …); the Thai UI shows
 * these. Month buckets ("April 2026") pass through unchanged. */
const GROUP_LABEL_TH: Record<string, string> = {
  Today: "วันนี้",
  Yesterday: "เมื่อวาน",
  "Previous 7 Days": "7 วันก่อน",
  "Previous 30 Days": "30 วันก่อน",
};

function localizeGroupLabel(label: string): string {
  return GROUP_LABEL_TH[label] ?? label;
}

export interface ChatSidebarProps {
  groups: ConversationGroup[];
  activeId: string | null;
  /** Current time for the per-row relative stamps (injected → deterministic). */
  now: number;
  onNewChat: () => void;
  onSelect: (id: string) => void;
  onRename: (id: string, title: string) => void;
  onDelete: (id: string) => void;
  /** Collapse the sidebar (desktop) / close the drawer (mobile). */
  onClose: () => void;
}

export function ChatSidebar({
  groups,
  activeId,
  now,
  onNewChat,
  onSelect,
  onRename,
  onDelete,
  onClose,
}: ChatSidebarProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState("");
  const [confirmingId, setConfirmingId] = useState<string | null>(null);

  function beginRename(id: string, title: string) {
    setConfirmingId(null);
    setEditingId(id);
    setDraft(title);
  }

  function commitRename() {
    if (editingId) {
      const title = draft.trim();
      if (title) onRename(editingId, title);
    }
    setEditingId(null);
  }

  return (
    <aside className="chat-sidebar" aria-label="ประวัติการสนทนา">
      <div className="chat-sidebar-head">
        <button type="button" className="chat-newchat" onClick={onNewChat}>
          <span className="chat-newchat-plus" aria-hidden="true">
            +
          </span>
          แชทใหม่
        </button>
        <button
          type="button"
          className="chat-sidebar-collapse"
          onClick={onClose}
          aria-label="ย่อแถบประวัติ"
        >
          <ChevronLeft />
        </button>
      </div>

      <nav className="chat-history" aria-label="รายการบทสนทนา">
        {groups.length === 0 && (
          <p className="chat-history-empty">ยังไม่มีบทสนทนา</p>
        )}
        {groups.map((group) => (
          <section key={group.label} className="chat-history-group">
            <h2 className="chat-history-band">
              {localizeGroupLabel(group.label)}
            </h2>
            <ul>
              {group.conversations.map((c) => {
                const isActive = c.id === activeId;
                if (editingId === c.id) {
                  return (
                    <li key={c.id} className="chat-history-row is-editing">
                      <input
                        className="chat-history-rename"
                        value={draft}
                        autoFocus
                        aria-label="เปลี่ยนชื่อบทสนทนา"
                        onChange={(e) => setDraft(e.target.value)}
                        onBlur={commitRename}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") commitRename();
                          if (e.key === "Escape") setEditingId(null);
                        }}
                      />
                    </li>
                  );
                }
                if (confirmingId === c.id) {
                  return (
                    <li key={c.id} className="chat-history-row is-confirming">
                      <span className="chat-history-confirm-label">
                        ลบบทสนทนานี้?
                      </span>
                      <span className="chat-history-actions">
                        <button
                          type="button"
                          className="chat-history-act is-danger"
                          onClick={() => {
                            onDelete(c.id);
                            setConfirmingId(null);
                          }}
                          aria-label="ยืนยันลบ"
                        >
                          ลบ
                        </button>
                        <button
                          type="button"
                          className="chat-history-act"
                          onClick={() => setConfirmingId(null)}
                          aria-label="ยกเลิก"
                        >
                          ยกเลิก
                        </button>
                      </span>
                    </li>
                  );
                }
                return (
                  <li
                    key={c.id}
                    className={`chat-history-row${isActive ? " is-active" : ""}`}
                  >
                    <button
                      type="button"
                      className="chat-history-open"
                      aria-current={isActive ? "true" : undefined}
                      onClick={() => onSelect(c.id)}
                    >
                      <span className="chat-history-title">{c.title}</span>
                      <span className="chat-history-time">
                        {formatRelativeTime(c.updatedAt, now)}
                      </span>
                    </button>
                    <span className="chat-history-actions">
                      <button
                        type="button"
                        className="chat-history-act"
                        onClick={() => beginRename(c.id, c.title)}
                        aria-label={`เปลี่ยนชื่อ ${c.title}`}
                      >
                        <PencilIcon />
                      </button>
                      <button
                        type="button"
                        className="chat-history-act"
                        onClick={() => {
                          setEditingId(null);
                          setConfirmingId(c.id);
                        }}
                        aria-label={`ลบ ${c.title}`}
                      >
                        <TrashIcon />
                      </button>
                    </span>
                  </li>
                );
              })}
            </ul>
          </section>
        ))}
      </nav>

      <div className="chat-sidebar-foot">
        <span className="chat-sidebar-dot" aria-hidden="true" />
        <span className="chat-sidebar-id">
          ผู้ช่วย AI
          <span className="chat-sidebar-org">T4 Labs</span>
        </span>
      </div>
    </aside>
  );
}

function ChevronLeft() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M10 3.5 5.5 8l4.5 4.5"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function PencilIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 16 16"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M11.5 2.5 13.5 4.5 5.5 12.5 3 13 3.5 10.5z"
        stroke="currentColor"
        strokeWidth="1.3"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function TrashIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 16 16"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M3 4.5h10M6.5 4.5V3h3v1.5M4.5 4.5l.5 8.5h6l.5-8.5"
        stroke="currentColor"
        strokeWidth="1.3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
