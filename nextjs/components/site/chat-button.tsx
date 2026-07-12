import Link from 'next/link';

/** Floating AI chat entry (Requirement §4.1.11) — links to the /chat assistant. */
export function ChatButton() {
  return (
    <Link href="/chat" className="chat">
      <i />
      Ask T4 AI
    </Link>
  );
}
