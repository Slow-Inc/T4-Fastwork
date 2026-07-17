/**
 * Adapter binding the pure `ContentGenerateService` (github-generate.ts) to the
 * real LLM: builds the prompt from a repo's GitHub context and parses the model's
 * JSON reply into `GeneratedContent`. The prompt + parse are pure and unit-tested;
 * the network call is `LlmService.complete` (injected at the module).
 */
import type { ChatMessage } from '../llm/llm.service';
import type { GeneratedContent, GenerateContext } from './github-generate';

/** Build the chat messages that ask the model for a project's showcase copy as
 * strict JSON. Bilingual (TH primary, EN title) per the site convention; grounded
 * only in the supplied repo context so the tech-guard downstream has something to
 * check against. */
export function buildGeneratePrompt(ctx: GenerateContext): ChatMessage[] {
  const languages = Object.keys(ctx.languages).join(', ') || '(none reported)';
  const topics = ctx.topics.join(', ') || '(none)';
  const system =
    'You write concise, factual portfolio copy for a software agency. ' +
    'Return ONLY a single JSON object, no markdown fence, no commentary. ' +
    'Schema: {"title":string(TH),"titleEn":string(EN),"description":string(TH, <=160 chars),' +
    '"content":string(TH, 2-3 short paragraphs separated by \\n\\n),"category":string,' +
    '"tags":string[],"technologies":string[]}. ' +
    'Do NOT invent technologies — only list ones evidenced by the languages or README below.';
  const user =
    `Repo description: ${ctx.description ?? '(none)'}\n` +
    `Languages: ${languages}\n` +
    `Topics: ${topics}\n` +
    `README:\n${ctx.readme.slice(0, 6000)}`;
  return [
    { role: 'system', content: system },
    { role: 'user', content: user },
  ];
}

/** Parse the model's reply into GeneratedContent. Tolerates a ```json fence or
 * surrounding prose by extracting the outermost {...}. Throws on unparseable or
 * shape-invalid output so the caller can skip (never write garbage). */
export function parseGeneratedContent(raw: string): GeneratedContent {
  const jsonText = extractJsonObject(raw);
  let obj: unknown;
  try {
    obj = JSON.parse(jsonText);
  } catch {
    throw new Error('generate: model did not return valid JSON');
  }
  const o = obj as Record<string, unknown>;
  const str = (v: unknown): string => (typeof v === 'string' ? v : '');
  const arr = (v: unknown): string[] =>
    Array.isArray(v) ? v.filter((x): x is string => typeof x === 'string') : [];
  const result: GeneratedContent = {
    title: str(o.title),
    titleEn: str(o.titleEn),
    description: str(o.description),
    content: str(o.content),
    category: str(o.category),
    tags: arr(o.tags),
    technologies: arr(o.technologies),
  };
  // Require every narrative field the patch would write, not just title/description
  // (#75): a partial reply that omitted titleEn/content would otherwise blank those
  // columns with empty strings. tags/technologies/category may legitimately be empty.
  if (
    !result.title ||
    !result.titleEn ||
    !result.description ||
    !result.content
  ) {
    throw new Error(
      'generate: JSON missing required text (title/titleEn/description/content)',
    );
  }
  return result;
}

/** Extract the outermost balanced {...} from a string that may carry a fence or
 * prose around it. */
function extractJsonObject(raw: string): string {
  const start = raw.indexOf('{');
  const end = raw.lastIndexOf('}');
  if (start === -1 || end === -1 || end < start) {
    throw new Error('generate: no JSON object found in model reply');
  }
  return raw.slice(start, end + 1);
}
