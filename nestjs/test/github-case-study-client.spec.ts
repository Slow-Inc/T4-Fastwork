import { describe, it, expect } from 'bun:test';
import { createCaseStudyLlmClient } from '../src/github/github-case-study-client';
import { runMapReduce } from '../src/github/github-case-study';
import type { ChatMessage } from '../src/llm/llm.service';

const extractReply = JSON.stringify({
  themes: ['caching'],
  architecture: 'LRU over Redis',
  tech: ['Redis'],
  userOutcomes: 'Faster loads',
  codeDepth: 'deep',
});
const caseStudyReply = JSON.stringify({
  title: 'ชื่อ',
  titleEn: 'Title',
  description: 'คำอธิบาย',
  content: 'ย่อหน้า',
  tags: ['RAG'],
  technologies: ['Redis'],
});

const meta = {
  description: 'AI manga reader',
  languages: { TypeScript: 1000 },
  topics: ['ai'],
  liveUrl: 'https://hayateotsu.space',
};

describe('createCaseStudyLlmClient', () => {
  it('mapFile: sends the map prompt to complete and parses into a FileExtract', async () => {
    let seen: ChatMessage[] | null = null;
    const client = createCaseStudyLlmClient(async (msgs) => {
      seen = msgs;
      return extractReply;
    });
    const e = await client.mapFile({
      path: 'docs/cache.md',
      blobSha: 'sha1',
      markdown: '# Cache\nLRU over Redis.',
    });
    // prompt was the map prompt (grounded in the file)
    expect(seen![1].content).toContain('docs/cache.md');
    // parsed + stamped from the document, not the model
    expect(e.path).toBe('docs/cache.md');
    expect(e.blobSha).toBe('sha1');
    expect(e.architecture).toBe('LRU over Redis');
  });

  it('reduce: sends the reduce prompt to complete and parses into a CaseStudy', async () => {
    let seen: ChatMessage[] | null = null;
    const client = createCaseStudyLlmClient(async (msgs) => {
      seen = msgs;
      return caseStudyReply;
    });
    const cs = await client.reduce(
      [
        {
          path: 'a.md',
          blobSha: 's',
          themes: ['t'],
          architecture: 'arch',
          tech: [],
          userOutcomes: '',
          codeDepth: '',
        },
      ],
      'developer',
      meta,
    );
    expect(seen![0].content).toContain('engineer'); // developer persona
    expect(cs.audience).toBe('developer');
    expect(cs.titleEn).toBe('Title');
  });

  it('mapFile: propagates a parse error on an unparseable reply (caller skips the file)', async () => {
    const client = createCaseStudyLlmClient(async () => 'sorry, cannot help');
    await expect(
      client.mapFile({ path: 'a.md', blobSha: 's', markdown: 'x' }),
    ).rejects.toThrow();
  });

  it('drives runMapReduce end-to-end from a single complete fn', async () => {
    // map replies for the extract, reduce replies for the 3 case studies
    const client = createCaseStudyLlmClient(async (msgs) => {
      const sys = msgs[0].content as string;
      return sys.includes('case study') ? caseStudyReply : extractReply;
    });
    const res = await runMapReduce(
      [{ path: 'README.md', blobSha: 's1', markdown: '# hi' }],
      meta,
      client,
    );
    expect(res.mapped).toBe(1);
    expect(res.caseStudies.map((c) => c.audience)).toEqual([
      'business',
      'semitech',
      'developer',
    ]);
  });
});
