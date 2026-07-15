import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import rehypeSanitize, { defaultSchema } from 'rehype-sanitize';
import rehypeHighlight from 'rehype-highlight';

/**
 * Full-fidelity renderer for GitHub-sourced README markdown (member profile +
 * project detail). Unlike `lib/markdown` (a minimal, HTML-free parser), a real
 * GitHub profile README is HTML-heavy — shields.io badges as `<a><img>`,
 * `<p align>` layout, Setext headings — so we render embedded HTML via
 * `rehype-raw`. The source is member-editable (`readmeOverride`) and
 * GitHub-fetched, i.e. untrusted, so `rehype-sanitize` (modelled on GitHub's own
 * allowlist) strips `<script>`, event handlers, and `javascript:` URLs. GFM
 * tables/task-lists via remark-gfm; code highlighting to match the chat.
 *
 * Hook-free so it renders on the server (no client JS) and in unit tests.
 * `ChatMarkdown` stays deliberately raw-HTML-free — assistant output has no
 * legitimate HTML and is a tighter security boundary.
 */
const schema = {
  ...defaultSchema,
  tagNames: [...(defaultSchema.tagNames ?? []), 'picture', 'source'],
  attributes: {
    ...defaultSchema.attributes,
    // `align` powers the centered layout common in profile READMEs.
    '*': [...(defaultSchema.attributes?.['*'] ?? []), 'align'],
    img: [...(defaultSchema.attributes?.img ?? []), 'width', 'height', 'align'],
    // preserve highlight.js language classes on fenced code.
    code: [...(defaultSchema.attributes?.code ?? []), 'className'],
    span: [...(defaultSchema.attributes?.span ?? []), 'className'],
    pre: [...(defaultSchema.attributes?.pre ?? []), 'className'],
  },
};

export function ReadmeMarkdown({ source }: { source: string }) {
  return (
    <div className="md md-readme">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[
          rehypeRaw,
          [rehypeSanitize, schema],
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
            <img alt={alt ?? ''} loading="lazy" {...props} />
          ),
          table: ({ children, ...props }) => (
            <div className="md-table">
              <table {...props}>{children}</table>
            </div>
          ),
        }}
      >
        {source}
      </ReactMarkdown>
    </div>
  );
}
