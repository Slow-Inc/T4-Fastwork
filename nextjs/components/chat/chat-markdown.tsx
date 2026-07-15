"use client";

import {
  isValidElement,
  useRef,
  useState,
  type ComponentPropsWithoutRef,
  type ReactNode,
} from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkBreaks from "remark-breaks";
import rehypeHighlight from "rehype-highlight";

/**
 * Full Markdown for assistant answers (Open WebUI parity), in our Visible-Grid
 * Swiss style. GFM (tables, task lists, strikethrough, autolinks) via remark-gfm;
 * syntax highlighting via rehype-highlight (highlight.js). Safe by construction —
 * no raw HTML is rendered (no rehype-raw), links open in a new tab, and fenced
 * code blocks get a language label + copy button. Streaming-safe: re-renders the
 * accumulated text on every token.
 */
export function ChatMarkdown({ children }: { children: string }) {
  return (
    <div className="chat-md">
      <ReactMarkdown
        remarkPlugins={[remarkGfm, remarkBreaks]}
        rehypePlugins={[
          [rehypeHighlight, { detect: true, ignoreMissing: true }],
        ]}
        components={{
          a: ({ href, children, ...props }) => (
            <a href={href} target="_blank" rel="noopener noreferrer" {...props}>
              {children}
            </a>
          ),
          img: ({ alt, ...props }) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img alt={alt ?? ""} loading="lazy" {...props} />
          ),
          table: ({ children, ...props }) => (
            <div className="chat-table">
              <table {...props}>{children}</table>
            </div>
          ),
          pre: CodeBlock,
        }}
      >
        {children}
      </ReactMarkdown>
    </div>
  );
}

/** A fenced code block: language chip + copy button over the highlighted code. */
function CodeBlock({ children }: ComponentPropsWithoutRef<"pre">) {
  const code = isValidElement(children) ? children : null;
  const className =
    (code?.props as { className?: string } | undefined)?.className ?? "";
  const lang = /language-([\w-]+)/.exec(className)?.[1] ?? "text";
  const raw = nodeToString(children).replace(/\n$/, "");

  return (
    <div className="chat-code">
      <div className="chat-code-head">
        <span className="chat-code-lang">{lang}</span>
        <CopyCode text={raw} />
      </div>
      <pre>{children}</pre>
    </div>
  );
}

function CopyCode({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  async function copy() {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      clearTimeout(timer.current);
      timer.current = setTimeout(() => setCopied(false), 1500);
    } catch {
      // clipboard blocked — no-op.
    }
  }

  return (
    <button
      type="button"
      className="chat-code-copy"
      onClick={copy}
      aria-label={copied ? "คัดลอกโค้ดแล้ว" : "คัดลอกโค้ด"}
    >
      {copied ? "คัดลอกแล้ว" : "คัดลอก"}
    </button>
  );
}

/** Recursively flatten rendered children to plain text (for the copy payload). */
function nodeToString(node: ReactNode): string {
  if (typeof node === "string") return node;
  if (typeof node === "number") return String(node);
  if (Array.isArray(node)) return node.map(nodeToString).join("");
  if (isValidElement(node)) {
    return nodeToString((node.props as { children?: ReactNode }).children);
  }
  return "";
}
