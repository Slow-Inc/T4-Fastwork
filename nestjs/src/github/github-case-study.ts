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

// --- JSON coercion helpers (shared by the Stage1/Stage2 parsers) ----------

const asStr = (v: unknown): string => (typeof v === 'string' ? v : '');
const asStrArr = (v: unknown): string[] =>
  Array.isArray(v) ? v.filter((x): x is string => typeof x === 'string') : [];

/** Extract the outermost balanced {...} from output that may carry a fence or
 * prose around it, and parse it. Throws on no-object / invalid JSON. */
function parseJsonObject(raw: string): Record<string, unknown> {
  const start = raw.indexOf('{');
  const end = raw.lastIndexOf('}');
  if (start === -1 || end === -1 || end < start) {
    throw new Error('case-study: no JSON object found in model reply');
  }
  try {
    return JSON.parse(raw.slice(start, end + 1)) as Record<string, unknown>;
  } catch {
    throw new Error('case-study: model did not return valid JSON');
  }
}

// --- Stage1: map (one compact extract per file) ---------------------------

/** A single file always fits the 128K window, but cap it so one map call never
 * approaches the budget on a pathological file. ~4 chars/token → 48K chars ≈ 12K
 * tokens, leaving ample headroom for the prompt + reasoning. */
const MAP_MARKDOWN_CAP = 48000;

/** Build the per-file map prompt: ask the model for a compact structured
 * extract of one document, grounded only in that file. */
export function buildMapPrompt(doc: ProjectDocument): ChatMessage[] {
  const system =
    'You distill one project document into a compact structured extract for later ' +
    'synthesis. Return ONLY a single JSON object, no markdown fence, no commentary. ' +
    'Schema: {"themes":string[],"architecture":string,"tech":string[],' +
    '"userOutcomes":string,"codeDepth":string}. ' +
    'Base every field strictly on the document; do not invent facts. ' +
    'Keep each string short (<= 2 sentences) — this is an index, not prose.';
  const user =
    `File path: ${doc.path}\n` +
    `Content:\n${doc.markdown.slice(0, MAP_MARKDOWN_CAP)}`;
  return [
    { role: 'system', content: system },
    { role: 'user', content: user },
  ];
}

/** Parse a map reply into a FileExtract, stamping the document's path + blobSha
 * (which the model never sees). Lenient on the content fields — a thin extract
 * is still usable input to the reduce — but throws on unparseable output so the
 * caller can skip that file rather than feed the reduce garbage. */
export function parseFileExtract(
  raw: string,
  doc: { path: string; blobSha: string },
): FileExtract {
  const o = parseJsonObject(raw);
  return {
    path: doc.path,
    blobSha: doc.blobSha,
    themes: asStrArr(o.themes),
    architecture: asStr(o.architecture),
    tech: asStrArr(o.tech),
    userOutcomes: asStr(o.userOutcomes),
    codeDepth: asStr(o.codeDepth),
  };
}

// --- blob_sha extract cache ------------------------------------------------

/**
 * Split the curated documents into the ones that must be (re-)mapped and the
 * cached extracts that can be reused unchanged. A file is reused iff a cached
 * extract exists for its exact `blob_sha` (content hash) — so only content
 * changes trigger an LLM map call, and a cached extract for a file no longer
 * present is dropped (never fed to the reduce). This is what makes regeneration
 * cheap + idempotent (ADR 0009 D2).
 */
export function selectDocsToMap(
  docs: ProjectDocument[],
  cached: FileExtract[],
): { toMap: ProjectDocument[]; reused: FileExtract[] } {
  const bySha = new Map(cached.map((e) => [e.blobSha, e]));
  const toMap: ProjectDocument[] = [];
  const reused: FileExtract[] = [];
  for (const d of docs) {
    const hit = bySha.get(d.blobSha);
    if (hit) reused.push(hit);
    else toMap.push(d);
  }
  return { toMap, reused };
}

// --- Stage2: reduce (one case study per audience) -------------------------

/** Repo-level context threaded into every reduce call (all audiences share it). */
export interface ReduceMeta {
  description: string | null;
  languages: Record<string, number>;
  topics: string[];
  liveUrl?: string | null;
}

/** How to pitch each variant (decision Q1 / ADR 0009 D1). The persona string is
 * embedded verbatim in the system prompt, so it doubles as the audience marker
 * the tests assert on. */
export const AUDIENCE_PERSONAS: Record<Audience, string> = {
  business:
    'Audience: a non-technical business decision-maker (SME owner or company hiring for a project). ' +
    'Lead with the problem solved, outcomes, and value; avoid jargon and implementation detail.',
  semitech:
    'Audience: a semi-technical reader who knows a little code (a product manager or founder-engineer). ' +
    'Balance the outcome with a clear, high-level explanation of how it works; light on deep internals.',
  developer:
    'Audience: a fellow software engineer. ' +
    'Go technical: architecture, stack choices, and the interesting engineering decisions and trade-offs.',
};

/** Compact one extract into a few labelled lines for the reduce input (keeps the
 * whole extract set small enough that ~50 files stay well under 128K). */
function renderExtract(e: FileExtract): string {
  const parts = [`- ${e.path}`];
  if (e.themes.length) parts.push(`  themes: ${e.themes.join(', ')}`);
  if (e.architecture) parts.push(`  architecture: ${e.architecture}`);
  if (e.tech.length) parts.push(`  tech: ${e.tech.join(', ')}`);
  if (e.userOutcomes) parts.push(`  outcomes: ${e.userOutcomes}`);
  if (e.codeDepth) parts.push(`  codeDepth: ${e.codeDepth}`);
  return parts.join('\n');
}

/** Build the reduce prompt for one audience: all extracts + repo metadata +
 * the audience persona → one case study as strict JSON. */
export function buildReducePrompt(
  extracts: FileExtract[],
  audience: Audience,
  meta: ReduceMeta,
): ChatMessage[] {
  const langs = Object.keys(meta.languages).join(', ') || '(none reported)';
  const topics = meta.topics.join(', ') || '(none)';
  const system =
    'You write a project case study for a software agency portfolio, in Thai ' +
    '(with an English title). ' +
    AUDIENCE_PERSONAS[audience] +
    ' Return ONLY a single JSON object, no markdown fence, no commentary. ' +
    'Schema: {"title":string(TH),"titleEn":string(EN),"description":string(TH, <=160 chars),' +
    '"content":string(TH, 3-5 short paragraphs separated by \\n\\n),' +
    '"tags":string[],"technologies":string[]}. ' +
    'Ground every claim in the extracts below; do NOT invent technologies.';
  const user =
    `Repo description: ${meta.description ?? '(none)'}\n` +
    `Languages: ${langs}\n` +
    `Topics: ${topics}\n` +
    `Live URL: ${meta.liveUrl ?? '(none)'}\n\n` +
    `Document extracts:\n${extracts.map(renderExtract).join('\n')}`;
  return [
    { role: 'system', content: system },
    { role: 'user', content: user },
  ];
}

/** Parse a reduce reply into a CaseStudy, stamping the audience (which the model
 * does not echo). Like the single-README parser, throws when any narrative field
 * the DB row needs is missing — a partial reply is skipped, never written blank. */
export function parseCaseStudy(raw: string, audience: Audience): CaseStudy {
  const o = parseJsonObject(raw);
  const cs: CaseStudy = {
    audience,
    title: asStr(o.title),
    titleEn: asStr(o.titleEn),
    description: asStr(o.description),
    content: asStr(o.content),
    tags: asStrArr(o.tags),
    technologies: asStrArr(o.technologies),
  };
  if (!cs.title || !cs.titleEn || !cs.description || !cs.content) {
    throw new Error(
      'case-study: JSON missing required text (title/titleEn/description/content)',
    );
  }
  return cs;
}
