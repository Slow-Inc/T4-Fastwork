/**
 * Pure helpers for admin Markdown → blog post fields (issue #133).
 * Server Actions re-parse the uploaded file; the browser may prefill the form
 * but is never the source of truth.
 */

const MAX_MARKDOWN_BYTES = 200_000;

export interface MarkdownPostFields {
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  readTimeMin: number;
}

export function slugifyMarkdownStem(input: string): string {
  return input
    .trim()
    .toLowerCase()
    .replace(/\.md$/i, '')
    .replace(/[^a-z0-9ก-๙\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/** Estimate read time: ~200 Thai/English words per minute, min 1. */
export function estimateReadTimeMin(text: string): number {
  const words = text.trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.ceil(words / 200));
}

/**
 * Map a Markdown file's text + filename into CMS blog fields. Stores the full
 * markdown as `content` (rendered via MarkdownContent on the public article).
 */
export function markdownFileToPostFields(
  text: string,
  filename: string,
): MarkdownPostFields {
  const content = text.replace(/^\uFEFF/, '').trim();
  if (!content) throw new Error('Markdown file is empty');
  if (new TextEncoder().encode(content).length > MAX_MARKDOWN_BYTES) {
    throw new Error('Markdown file is too large (max 200KB)');
  }

  const h1 = content.match(/^#\s+(.+)$/m);
  const stem = filename.replace(/^.*[\\/]/, '').replace(/\.md$/i, '') || 'post';
  const title = (h1?.[1] ?? stem).trim();
  const slug = slugifyMarkdownStem(stem) || slugifyMarkdownStem(title) || 'post';

  const withoutH1 = h1
    ? content.replace(h1[0], '').trim()
    : content;
  const firstPara =
    withoutH1
      .split(/\n\s*\n/)
      .map((p) => p.replace(/^#+\s+/, '').trim())
      .find((p) => p.length > 0) ?? '';
  const excerpt = firstPara.slice(0, 240);

  return {
    title,
    slug,
    excerpt,
    content,
    readTimeMin: estimateReadTimeMin(content),
  };
}

export { MAX_MARKDOWN_BYTES };
