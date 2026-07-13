/**
 * A compact, dependency-free Markdown renderer (spec 2026-07-14). Used for the
 * profile README and the project blog supplement. A pure `parseMarkdown` splits
 * the source into blocks (unit-tested); `MarkdownContent` renders them. Inline
 * handling covers bold/italic/code, links, and images (so shields.io badges and
 * screenshots in a README show). Intentionally minimal — no tables/HTML — so it
 * is safe (no `dangerouslySetInnerHTML`) and small.
 */
import type { ReactNode } from 'react';

export type MdBlock =
  | { type: 'heading'; level: number; text: string }
  | { type: 'para'; text: string }
  | { type: 'code'; lang: string; code: string }
  | { type: 'list'; ordered: boolean; items: string[] }
  | { type: 'quote'; text: string }
  | { type: 'hr' };

export function parseMarkdown(src: string): MdBlock[] {
  const lines = src.replace(/\r\n/g, '\n').split('\n');
  const blocks: MdBlock[] = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];
    const trimmed = line.trim();

    if (trimmed === '') {
      i++;
      continue;
    }

    // Fenced code block
    const fence = trimmed.match(/^```(\w*)/);
    if (fence) {
      const lang = fence[1] ?? '';
      const code: string[] = [];
      i++;
      while (i < lines.length && !lines[i].trim().startsWith('```')) {
        code.push(lines[i]);
        i++;
      }
      i++; // closing fence
      blocks.push({ type: 'code', lang, code: code.join('\n') });
      continue;
    }

    // Horizontal rule
    if (/^(-{3,}|\*{3,}|_{3,})$/.test(trimmed)) {
      blocks.push({ type: 'hr' });
      i++;
      continue;
    }

    // Heading
    const heading = trimmed.match(/^(#{1,6})\s+(.*)$/);
    if (heading) {
      blocks.push({
        type: 'heading',
        level: heading[1].length,
        text: heading[2].trim(),
      });
      i++;
      continue;
    }

    // Blockquote
    if (trimmed.startsWith('>')) {
      const quote: string[] = [];
      while (i < lines.length && lines[i].trim().startsWith('>')) {
        quote.push(lines[i].trim().replace(/^>\s?/, ''));
        i++;
      }
      blocks.push({ type: 'quote', text: quote.join(' ') });
      continue;
    }

    // List (unordered or ordered)
    const bullet = trimmed.match(/^([-*+])\s+(.*)$/);
    const ordered = trimmed.match(/^\d+\.\s+(.*)$/);
    if (bullet || ordered) {
      const isOrdered = Boolean(ordered);
      const items: string[] = [];
      while (i < lines.length) {
        const t = lines[i].trim();
        const b = t.match(/^[-*+]\s+(.*)$/);
        const o = t.match(/^\d+\.\s+(.*)$/);
        if (isOrdered && o) items.push(o[1]);
        else if (!isOrdered && b) items.push(b[1]);
        else break;
        i++;
      }
      blocks.push({ type: 'list', ordered: isOrdered, items });
      continue;
    }

    // Paragraph — gather until a blank line or a block starter
    const para: string[] = [];
    while (i < lines.length && lines[i].trim() !== '') {
      const t = lines[i].trim();
      if (
        /^```/.test(t) ||
        /^#{1,6}\s/.test(t) ||
        t.startsWith('>') ||
        /^([-*+]|\d+\.)\s/.test(t) ||
        /^(-{3,}|\*{3,}|_{3,})$/.test(t)
      )
        break;
      para.push(t);
      i++;
    }
    blocks.push({ type: 'para', text: para.join(' ') });
  }

  return blocks;
}

/** Render inline markdown (images, links, bold, italic, code) to React nodes. */
function renderInline(text: string, keyBase: string): ReactNode[] {
  const nodes: ReactNode[] = [];
  const pattern =
    /!\[([^\]]*)\]\(([^)]+)\)|\[([^\]]+)\]\(([^)]+)\)|\*\*([^*]+)\*\*|\*([^*]+)\*|`([^`]+)`/g;
  let last = 0;
  let m: RegExpExecArray | null;
  let k = 0;
  while ((m = pattern.exec(text)) !== null) {
    if (m.index > last) nodes.push(text.slice(last, m.index));
    const key = `${keyBase}-${k++}`;
    if (m[2] !== undefined) {
      // image ![alt](src)
      // eslint-disable-next-line @next/next/no-img-element
      nodes.push(<img key={key} src={m[2]} alt={m[1] ?? ''} loading="lazy" />);
    } else if (m[4] !== undefined) {
      nodes.push(
        <a key={key} href={m[4]} target="_blank" rel="noopener noreferrer">
          {m[3]}
        </a>,
      );
    } else if (m[5] !== undefined) {
      nodes.push(<strong key={key}>{m[5]}</strong>);
    } else if (m[6] !== undefined) {
      nodes.push(<em key={key}>{m[6]}</em>);
    } else if (m[7] !== undefined) {
      nodes.push(<code key={key}>{m[7]}</code>);
    }
    last = m.index + m[0].length;
  }
  if (last < text.length) nodes.push(text.slice(last));
  return nodes;
}

export function MarkdownContent({ source }: { source: string }) {
  const blocks = parseMarkdown(source);
  return (
    <div className="md">
      {blocks.map((b, i) => {
        const key = `b-${i}`;
        switch (b.type) {
          case 'heading': {
            const Tag = `h${Math.min(b.level, 6)}` as 'h1';
            return <Tag key={key}>{renderInline(b.text, key)}</Tag>;
          }
          case 'code':
            return (
              <pre key={key} className="md-code" data-lang={b.lang}>
                <code>{b.code}</code>
              </pre>
            );
          case 'list':
            return b.ordered ? (
              <ol key={key}>
                {b.items.map((it, j) => (
                  <li key={j}>{renderInline(it, `${key}-${j}`)}</li>
                ))}
              </ol>
            ) : (
              <ul key={key}>
                {b.items.map((it, j) => (
                  <li key={j}>{renderInline(it, `${key}-${j}`)}</li>
                ))}
              </ul>
            );
          case 'quote':
            return (
              <blockquote key={key}>{renderInline(b.text, key)}</blockquote>
            );
          case 'hr':
            return <hr key={key} />;
          default:
            return <p key={key}>{renderInline(b.text, key)}</p>;
        }
      })}
    </div>
  );
}
