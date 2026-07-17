/**
 * Map-reduce case-study generation over a project's Markdown corpus (ADR 0009 D2,
 * P2 #65). The single-README `buildGeneratePrompt` (github-generate-client.ts)
 * does not scale to a large MD set — concatenating every file blows the 128K
 * `qwen3.6-35b-a3b` gateway context. Instead:
 *
 *   Stage0 curate  — drop boilerplate, keep the substantive `.md` set.
 *   Stage1 map     — one LLM call per file → a compact structured extract,
 *                    cached by `blob_sha` so an unchanged file is never re-mapped.
 *   Stage2 reduce  — feed all (compact) extracts + an audience persona → write
 *                    the case study, once per `business` / `semitech` / `developer`.
 *
 * Everything here is pure (prompt builders, parsers, the curate/cache filters,
 * the metadata mapper) or takes the LLM callers as injected deps (`runMapReduce`)
 * — so the map-reduce logic is unit-tested without a network call.
 */
import type { ChatMessage } from '../llm/llm.service';

/** A Markdown document from a repo — a `project_documents` row projection. */
export interface ProjectDocument {
  path: string;
  blobSha: string;
  markdown: string;
}

/** Stage1 output: a compact structured extract of one file (see ADR 0009 D2). */
export interface FileExtract {
  path: string;
  blobSha: string;
  themes: string[];
  architecture: string;
  tech: string[];
  userOutcomes: string;
  codeDepth: string;
}

/** The three case-study variants (ADR 0009 D1, decision Q1). */
export type Audience = 'business' | 'semitech' | 'developer';
export const AUDIENCES: readonly Audience[] = [
  'business',
  'semitech',
  'developer',
];

/** Stage2 output: one audience-tuned case study. */
export interface CaseStudy {
  audience: Audience;
  title: string;
  titleEn: string;
  description: string;
  content: string;
  tags: string[];
  technologies: string[];
}

// --- Stage0: curate -------------------------------------------------------

/** Filenames that are project boilerplate, not showcase source material. */
const BOILERPLATE_BASENAMES = new Set([
  'changelog.md',
  'license.md',
  'code_of_conduct.md',
  'contributing.md',
  'security.md',
  'support.md',
]);

/**
 * Keep the substantive Markdown of a repo; drop non-`.md` files, boilerplate
 * (CHANGELOG/LICENSE/CODE_OF_CONDUCT/CONTRIBUTING/…), `.github/` templates, and
 * anything vendored under `node_modules/`.
 */
export function curateDocuments(docs: ProjectDocument[]): ProjectDocument[] {
  return docs.filter((d) => {
    const p = d.path.toLowerCase();
    if (!p.endsWith('.md')) return false;
    if (p.startsWith('.github/') || p.includes('/.github/')) return false;
    if (p.startsWith('node_modules/') || p.includes('/node_modules/'))
      return false;
    const base = p.split('/').pop() ?? p;
    if (BOILERPLATE_BASENAMES.has(base)) return false;
    return true;
  });
}
