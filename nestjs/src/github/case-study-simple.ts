/**
 * Simplified self-updating case study (ADR 0013 — supersedes the dormant ADR 0009
 * map-reduce). For one published github-backed project whose README changed, a
 * single LLM call writes the showcase copy; it is published as a `blog_posts`
 * case_study row and mirrored into `projects.content` (for RAG). Reuses the
 * generate prompt/parse + the `validateTechnologies` guard from github-generate —
 * no map-reduce, no `project_documents`, no 3 audiences, no GitHub App.
 *
 * The README source, LLM, and persistence are injected so the delta-gate + guard
 * logic (the correctness-bearing parts) are pure and unit-tested with no network/DB.
 */
import {
  buildGeneratePrompt,
  parseGeneratedContent,
} from './github-generate-client';
import {
  validateTechnologies,
  type GeneratedContent,
  type GenerateContext,
} from './github-generate';
import type { ChatMessage } from '../llm/llm.service';
import type { ReadmeSnapshot } from './github-detail.service';

/** The project fields the generator reads (from listPublishedGithubProjects). */
export interface CaseStudyProject {
  id: number;
  slug: string;
  ghOwner: string | null;
  ghRepo: string | null;
  readmeSha: string | null;
  description: string | null;
  /** Showcase deep-detail body — empty + auto-owned still needs fill (#160). */
  content: string | null;
  contentOwner: 'auto' | 'human';
}

/**
 * Run generation when the README sha changed, OR when deep-detail content is
 * still empty and auto-owned (#160 backfill). Human-owned empty content is left
 * alone.
 */
export function shouldGenerateCaseStudy(
  project: CaseStudyProject,
  snapSha: string,
): boolean {
  if (!project.readmeSha || project.readmeSha !== snapSha) return true;
  const empty = project.content == null || project.content.trim() === '';
  return empty && project.contentOwner === 'auto';
}

/** Persistence surface — see PgCaseStudySimpleStore. */
export interface CaseStudySimpleStore {
  listPublishedGithubProjects(): Promise<CaseStudyProject[]>;
  publishCaseStudy(
    projectId: number,
    slug: string,
    gen: GeneratedContent,
    sha: string,
  ): Promise<void>;
}

/** README reader surface (subset of GithubReadService). */
export interface ReadmeReader {
  getRepoReadme(
    owner: string,
    repo: string,
  ): Promise<{ data: unknown; stale: boolean } | null>;
}

/** LLM surface (subset of LlmService). */
export interface CompletionLlm {
  complete(messages: ChatMessage[]): Promise<string>;
}

/** Narrow a readme snapshot's `unknown` data to a well-formed ReadmeSnapshot. */
function asReadmeSnapshot(data: unknown): ReadmeSnapshot | null {
  if (data == null || typeof data !== 'object') return null;
  const o = data as Record<string, unknown>;
  if (typeof o.markdown !== 'string' || typeof o.sha !== 'string') return null;
  return { markdown: o.markdown, sha: o.sha };
}

export class CaseStudySimpleService {
  constructor(
    private readonly readme: ReadmeReader,
    private readonly llm: CompletionLlm,
    private readonly store: CaseStudySimpleStore,
  ) {}

  async generateForProject(
    project: CaseStudyProject,
  ): Promise<{ generated: boolean }> {
    if (!project.ghOwner || !project.ghRepo) return { generated: false };

    const rr = await this.readme.getRepoReadme(project.ghOwner, project.ghRepo);
    const snap = asReadmeSnapshot(rr?.data);
    if (!snap) return { generated: false };

    // Delta gate (#160): unchanged README skips unless content still empty+auto.
    if (!shouldGenerateCaseStudy(project, snap.sha)) {
      return { generated: false };
    }

    const ctx: GenerateContext = {
      readmeSha: snap.sha,
      readme: snap.markdown,
      languages: {},
      description: project.description,
      topics: [],
    };
    const gen = parseGeneratedContent(
      await this.llm.complete(buildGeneratePrompt(ctx)),
    );
    // Same tech guard as ContentGenerateService — drop anything the model invented
    // that the README doesn't evidence (defense-in-depth behind the UNTRUSTED_README
    // fence, which is the primary injection control). NOTE: the simplified path has no
    // repo-language metadata (`languages: {}`), so the guard degrades to a README
    // substring check — a `technologies` tag is only cosmetic (free text on the blog
    // post), and the fence, not this guard, blocks prompt injection. Supplying real
    // language evidence is a follow-up if the tag quality matters.
    const guarded: GeneratedContent = {
      ...gen,
      technologies: validateTechnologies(gen.technologies, ctx.languages, ctx.readme),
    };

    await this.store.publishCaseStudy(project.id, project.slug, guarded, snap.sha);
    return { generated: true };
  }
}
