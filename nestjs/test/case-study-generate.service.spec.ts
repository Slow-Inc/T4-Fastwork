import { describe, it, expect } from 'bun:test';
import { CaseStudyGenerateService } from '../src/github/github-case-study-persist';
import type { CaseStudyStore } from '../src/github/github-case-study-persist';
import type {
  ProjectDocument,
  FileExtract,
  CaseStudy,
} from '../src/github/github-case-study';
import type { ChatMessage } from '../src/llm/llm.service';
import type { ReduceMeta } from '../src/github/github-case-study';

const META: ReduceMeta = {
  description: 'a repo',
  languages: { TypeScript: 100 },
  topics: ['t4-showcase'],
  liveUrl: 'https://x.dev',
};

// A configurable fake store that records the writes the orchestration makes.
function fakeStore(over: Partial<CaseStudyStore> = {}) {
  const calls = {
    saveExtracts: [] as FileExtract[][],
    upserts: [] as { slug: string; studies: CaseStudy[] }[],
    jobs: [] as { status: string; error?: string }[],
  };
  const store: CaseStudyStore = {
    readManifest: async () => ({
      docs: [
        { path: 'README.md', blobSha: 'aaa', markdown: '# hi' },
        { path: 'docs/a.md', blobSha: 'bbb', markdown: 'x' },
      ] as ProjectDocument[],
      cachedExtracts: [] as FileExtract[],
    }),
    saveExtracts: async (_p, e) => {
      calls.saveExtracts.push(e);
    },
    upsertCaseStudies: async (_p, slug, studies) => {
      calls.upserts.push({ slug, studies });
    },
    isJobDone: async () => false,
    recordJob: async (_p, _h, _v, status, error) => {
      calls.jobs.push({ status, error });
    },
    ...over,
  };
  return { store, calls };
}

// A fake LLM `complete`: returns a map extract for a map prompt and a case study
// for a reduce prompt (distinguished by the system prompt), counting its calls.
function fakeComplete() {
  let count = 0;
  const fn = (messages: ChatMessage[]): Promise<string> => {
    count++;
    const sys = messages[0]?.content ?? '';
    if (sys.includes('distill one project document')) {
      return Promise.resolve(
        '{"themes":["auth"],"architecture":"modular","tech":["ts"],"userOutcomes":"faster","codeDepth":"deep"}',
      );
    }
    return Promise.resolve(
      '{"title":"ต","titleEn":"T","description":"d","content":"c","tags":["a"],"technologies":["ts"]}',
    );
  };
  return { fn, calls: () => count };
}

describe('CaseStudyGenerateService (#81 orchestration + idempotency)', () => {
  it('AC#2: skips entirely when the manifest+prompt already succeeded — ZERO LLM calls, no writes', async () => {
    const { store, calls } = fakeStore({ isJobDone: async () => true });
    const llm = fakeComplete();
    const svc = new CaseStudyGenerateService(store, llm.fn);

    const res = await svc.generate(7, 'mangadock', META);

    expect(res.generated).toBe(false);
    expect(res.reason).toBe('unchanged');
    expect(llm.calls()).toBe(0);
    expect(calls.upserts).toHaveLength(0);
    expect(calls.jobs).toHaveLength(0);
  });

  it('AC#1: generates + persists 3 audience case studies, caches extracts, records the job done', async () => {
    const { store, calls } = fakeStore();
    const llm = fakeComplete();
    const svc = new CaseStudyGenerateService(store, llm.fn);

    const res = await svc.generate(7, 'mangadock', META);

    expect(res.generated).toBe(true);
    expect(res.written).toBe(3);
    expect(calls.upserts).toHaveLength(1);
    expect(calls.upserts[0].slug).toBe('mangadock');
    expect(calls.upserts[0].studies.map((s) => s.audience).sort()).toEqual([
      'business',
      'developer',
      'semitech',
    ]);
    expect(calls.saveExtracts).toHaveLength(1);
    expect(calls.jobs).toEqual([{ status: 'done', error: undefined }]);
  });

  it('records the job done but writes no posts when the repo yields no substance', async () => {
    const { store, calls } = fakeStore();
    // every map returns an empty extract → runMapReduce produces 0 case studies
    const llm = {
      fn: (): Promise<string> => Promise.resolve('{}'),
      calls: () => 0,
    };
    const svc = new CaseStudyGenerateService(store, llm.fn);

    const res = await svc.generate(7, 'mangadock', META);

    expect(res.generated).toBe(false);
    expect(res.reason).toBe('no-substance');
    expect(calls.upserts).toHaveLength(0);
    expect(calls.jobs).toEqual([{ status: 'done', error: undefined }]);
  });

  it('records the job failed and rethrows when generation throws', async () => {
    const { store, calls } = fakeStore();
    // maps succeed (substantive) but every reduce rejects → runMapReduce throws
    const boom = (messages: ChatMessage[]): Promise<string> => {
      const sys = messages[0]?.content ?? '';
      if (sys.includes('distill one project document')) {
        return Promise.resolve(
          '{"themes":["x"],"architecture":"a","tech":["t"],"userOutcomes":"o","codeDepth":"d"}',
        );
      }
      return Promise.reject(new Error('gateway down'));
    };
    const svc = new CaseStudyGenerateService(store, boom);

    await expect(svc.generate(7, 'mangadock', META)).rejects.toThrow(
      'gateway down',
    );
    expect(calls.jobs).toHaveLength(1);
    expect(calls.jobs[0].status).toBe('failed');
  });
});
