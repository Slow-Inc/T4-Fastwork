import { describe, it, expect } from 'bun:test';
import {
  curateDocuments,
  buildMapPrompt,
  parseFileExtract,
  selectDocsToMap,
  buildReducePrompt,
  parseCaseStudy,
  mapRepoMetadata,
  runMapReduce,
  AUDIENCE_PERSONAS,
  AUDIENCES,
  type ProjectDocument,
  type FileExtract,
  type CaseStudy,
  type Audience,
} from '../src/github/github-case-study';

const doc = (
  path: string,
  blobSha = 'sha',
  markdown = '# x',
): ProjectDocument => ({
  path,
  blobSha,
  markdown,
});

describe('curateDocuments (Stage0)', () => {
  it('keeps repo markdown, drops non-markdown', () => {
    const kept = curateDocuments([
      doc('README.md'),
      doc('docs/architecture.md'),
      doc('src/index.ts'),
      doc('package.json'),
    ]);
    expect(kept.map((d) => d.path)).toEqual([
      'README.md',
      'docs/architecture.md',
    ]);
  });

  it('drops boilerplate (CHANGELOG, LICENSE, CODE_OF_CONDUCT, CONTRIBUTING)', () => {
    const kept = curateDocuments([
      doc('CHANGELOG.md'),
      doc('LICENSE.md'),
      doc('CODE_OF_CONDUCT.md'),
      doc('CONTRIBUTING.md'),
      doc('docs/design.md'),
    ]);
    expect(kept.map((d) => d.path)).toEqual(['docs/design.md']);
  });

  it('drops .github/ templates and node_modules/ vendored docs', () => {
    const kept = curateDocuments([
      doc('.github/PULL_REQUEST_TEMPLATE.md'),
      doc('.github/ISSUE_TEMPLATE/bug.md'),
      doc('node_modules/foo/README.md'),
      doc('docs/showcase/cache-system.md'),
    ]);
    expect(kept.map((d) => d.path)).toEqual(['docs/showcase/cache-system.md']);
  });

  it('is case-insensitive on extension and boilerplate names', () => {
    const kept = curateDocuments([
      doc('Readme.MD'),
      doc('license.md'),
      doc('changelog.MD'),
    ]);
    expect(kept.map((d) => d.path)).toEqual(['Readme.MD']);
  });
});

describe('buildMapPrompt (Stage1)', () => {
  it('grounds the extract prompt in one file (path + markdown)', () => {
    const msgs = buildMapPrompt(
      doc('docs/cache.md', 'sha1', '# Cache system\nUses an LRU with Redis.'),
    );
    expect(msgs).toHaveLength(2);
    expect(msgs[0].role).toBe('system');
    const user = msgs[1].content as string;
    expect(user).toContain('docs/cache.md');
    expect(user).toContain('LRU with Redis');
  });

  it('caps a huge single file so one map call stays inside 128K', () => {
    const user = buildMapPrompt(doc('big.md', 'sha', 'y'.repeat(200000)))[1]
      .content as string;
    // one file must not itself approach the 128K window (~4 chars/token)
    expect(user.length).toBeLessThan(60000);
  });
});

describe('parseFileExtract (Stage1)', () => {
  const raw = JSON.stringify({
    themes: ['caching', 'performance'],
    architecture: 'LRU cache fronting Redis',
    tech: ['Redis', 'TypeScript'],
    userOutcomes: 'Faster page loads',
    codeDepth: 'deep',
  });

  it('parses an extract and stamps path + blobSha from the document', () => {
    const e = parseFileExtract(raw, { path: 'docs/cache.md', blobSha: 'sha1' });
    expect(e.path).toBe('docs/cache.md');
    expect(e.blobSha).toBe('sha1');
    expect(e.themes).toEqual(['caching', 'performance']);
    expect(e.tech).toEqual(['Redis', 'TypeScript']);
  });

  it('tolerates a ```json fence and surrounding prose', () => {
    const e = parseFileExtract('```json\n' + raw + '\n```', {
      path: 'a.md',
      blobSha: 's',
    });
    expect(e.architecture).toBe('LRU cache fronting Redis');
  });

  it('defaults missing/invalid fields to empty (a thin extract is not fatal)', () => {
    const e = parseFileExtract(JSON.stringify({ themes: ['x', 2, null] }), {
      path: 'a.md',
      blobSha: 's',
    });
    expect(e.themes).toEqual(['x']);
    expect(e.architecture).toBe('');
    expect(e.tech).toEqual([]);
    expect(e.userOutcomes).toBe('');
    expect(e.codeDepth).toBe('');
  });

  it('throws on unparseable output so the caller can skip the file', () => {
    expect(() =>
      parseFileExtract('not json at all', { path: 'a.md', blobSha: 's' }),
    ).toThrow();
  });
});

describe('selectDocsToMap (blob_sha cache)', () => {
  const extract = (path: string, blobSha: string): FileExtract => ({
    path,
    blobSha,
    themes: [],
    architecture: '',
    tech: [],
    userOutcomes: '',
    codeDepth: '',
  });

  it('maps only changed-SHA files; reuses cached extracts for unchanged', () => {
    const docs = [
      doc('a.md', 'sha-a-v2'), // changed
      doc('b.md', 'sha-b'), //     unchanged
    ];
    const cached = [extract('a.md', 'sha-a-v1'), extract('b.md', 'sha-b')];
    const { toMap, reused } = selectDocsToMap(docs, cached);
    expect(toMap.map((d) => d.path)).toEqual(['a.md']);
    expect(reused.map((e) => e.path)).toEqual(['b.md']);
  });

  it('maps everything when there is no cache', () => {
    const docs = [doc('a.md', 's1'), doc('b.md', 's2')];
    const { toMap, reused } = selectDocsToMap(docs, []);
    expect(toMap).toHaveLength(2);
    expect(reused).toHaveLength(0);
  });

  it('drops a stale cached extract for a file no longer present', () => {
    const docs = [doc('a.md', 'sha-a')];
    const cached = [extract('a.md', 'sha-a'), extract('deleted.md', 'sha-d')];
    const { toMap, reused } = selectDocsToMap(docs, cached);
    expect(toMap).toHaveLength(0);
    expect(reused.map((e) => e.path)).toEqual(['a.md']); // deleted.md not reused
  });
});

describe('buildReducePrompt (Stage2)', () => {
  const extracts: FileExtract[] = [
    {
      path: 'docs/cache.md',
      blobSha: 's1',
      themes: ['caching'],
      architecture: 'LRU over Redis',
      tech: ['Redis'],
      userOutcomes: 'Faster loads',
      codeDepth: 'deep',
    },
  ];
  const meta = {
    description: 'AI manga reader',
    languages: { TypeScript: 1000 },
    topics: ['ai', 'ocr'],
    liveUrl: 'https://hayateotsu.space',
  };

  it('has a distinct persona per audience', () => {
    expect(AUDIENCES).toEqual(['business', 'semitech', 'developer']);
    const personas = AUDIENCES.map((a) => AUDIENCE_PERSONAS[a]);
    expect(new Set(personas).size).toBe(3); // all distinct
    personas.forEach((p) => expect(p.length).toBeGreaterThan(0));
  });

  it('feeds all extracts + repo meta + the audience persona into the prompt', () => {
    const msgs = buildReducePrompt(extracts, 'business', meta);
    expect(msgs[0].role).toBe('system');
    expect(msgs[0].content).toContain(AUDIENCE_PERSONAS.business);
    const user = msgs[1].content as string;
    expect(user).toContain('LRU over Redis'); // extract architecture
    expect(user).toContain('AI manga reader'); // repo description
    expect(user).toContain('hayateotsu.space'); // live url is context
  });

  it('varies the system persona between audiences', () => {
    const dev = buildReducePrompt(extracts, 'developer', meta)[0]
      .content as string;
    const biz = buildReducePrompt(extracts, 'business', meta)[0]
      .content as string;
    expect(dev).not.toBe(biz);
    expect(dev).toContain(AUDIENCE_PERSONAS.developer);
  });
});

describe('parseCaseStudy (Stage2)', () => {
  const good = JSON.stringify({
    title: 'มังงะด็อค',
    titleEn: 'MangaDock',
    description: 'แพลตฟอร์มแปลมังงะด้วย AI',
    content: 'ย่อหน้าแรก\n\nย่อหน้าสอง',
    tags: ['RAG'],
    technologies: ['Next.js'],
  });

  it('parses a case study and stamps the audience', () => {
    const cs = parseCaseStudy(good, 'developer');
    expect(cs.audience).toBe('developer');
    expect(cs.titleEn).toBe('MangaDock');
    expect(cs.technologies).toEqual(['Next.js']);
  });

  it('throws when a required narrative field is missing (never write a blank)', () => {
    expect(() =>
      parseCaseStudy(
        JSON.stringify({ title: 'T', titleEn: 'Te', description: 'D' }), // no content
        'business',
      ),
    ).toThrow();
  });

  it('rejects a whitespace-only required field (would persist a blank title)', () => {
    expect(() =>
      parseCaseStudy(
        JSON.stringify({
          title: '   ',
          titleEn: 'T',
          description: 'D',
          content: 'C',
        }),
        'business',
      ),
    ).toThrow();
  });
});

describe('mapRepoMetadata (audit #17)', () => {
  it('maps homepageUrl -> live_url and openGraphImageUrl -> cover fallback', () => {
    const m = mapRepoMetadata({
      homepageUrl: 'https://hayateotsu.space',
      openGraphImageUrl: 'https://og.example/card.png',
    });
    expect(m.liveUrl).toBe('https://hayateotsu.space');
    expect(m.coverImageFallback).toBe('https://og.example/card.png');
  });

  it('treats empty / whitespace / missing as null', () => {
    expect(
      mapRepoMetadata({ homepageUrl: '', openGraphImageUrl: '  ' }),
    ).toEqual({ liveUrl: null, coverImageFallback: null });
    expect(mapRepoMetadata({})).toEqual({
      liveUrl: null,
      coverImageFallback: null,
    });
    expect(
      mapRepoMetadata({ homepageUrl: null, openGraphImageUrl: null }),
    ).toEqual({ liveUrl: null, coverImageFallback: null });
  });

  it('normalizes a scheme-less homepage to https so the link is not relative', () => {
    expect(mapRepoMetadata({ homepageUrl: 'hayateotsu.space' }).liveUrl).toBe(
      'https://hayateotsu.space',
    );
    expect(
      mapRepoMetadata({ homepageUrl: '  hayateotsu.space  ' }).liveUrl,
    ).toBe('https://hayateotsu.space');
  });
});

describe('runMapReduce (orchestrator)', () => {
  const meta = {
    description: 'AI manga reader',
    languages: { TypeScript: 1000 },
    topics: ['ai'],
    liveUrl: 'https://hayateotsu.space',
  };
  const extractOf = (d: ProjectDocument): FileExtract => ({
    path: d.path,
    blobSha: d.blobSha,
    themes: ['t'],
    architecture: `arch of ${d.path}`,
    tech: ['TypeScript'],
    userOutcomes: 'o',
    codeDepth: 'moderate',
  });
  const csOf = (audience: Audience): CaseStudy => ({
    audience,
    title: 'ที',
    titleEn: 'T',
    description: 'ดี',
    content: 'ย่อหน้า',
    tags: [],
    technologies: ['TypeScript'],
  });

  it('curates, maps changed files, reduces once per audience', async () => {
    const mapped: string[] = [];
    const reduced: Audience[] = [];
    const res = await runMapReduce(
      [doc('README.md', 's1'), doc('LICENSE.md', 'sx'), doc('src/x.ts', 'sy')],
      meta,
      {
        mapFile: async (d) => {
          mapped.push(d.path);
          return extractOf(d);
        },
        reduce: async (_e, a) => {
          reduced.push(a);
          return csOf(a);
        },
      },
    );
    expect(mapped).toEqual(['README.md']); // LICENSE + .ts curated out
    expect(reduced).toEqual(['business', 'semitech', 'developer']);
    expect(res.caseStudies).toHaveLength(3);
    expect(res.mapped).toBe(1);
    expect(res.reused).toBe(0);
  });

  it('reuses cached extracts for unchanged SHAs — no map call', async () => {
    const docs = [doc('README.md', 's1'), doc('docs/a.md', 's2')];
    const cache = docs.map(extractOf);
    let mapCalls = 0;
    const res = await runMapReduce(docs, meta, {
      mapFile: async (d) => {
        mapCalls++;
        return extractOf(d);
      },
      reduce: async (_e, a) => csOf(a),
      cachedExtracts: cache,
    });
    expect(mapCalls).toBe(0);
    expect(res.mapped).toBe(0);
    expect(res.reused).toBe(2);
    expect(res.caseStudies).toHaveLength(3);
  });

  it('re-maps only the file whose SHA changed', async () => {
    const docs = [doc('README.md', 's1-v2'), doc('docs/a.md', 's2')];
    const cache = [
      extractOf(doc('README.md', 's1-v1')),
      extractOf(doc('docs/a.md', 's2')),
    ];
    const mapped: string[] = [];
    const res = await runMapReduce(docs, meta, {
      mapFile: async (d) => {
        mapped.push(d.path);
        return extractOf(d);
      },
      reduce: async (_e, a) => csOf(a),
      cachedExtracts: cache,
    });
    expect(mapped).toEqual(['README.md']);
    expect(res.reused).toBe(1);
  });

  it('skips a file whose map call fails, still produces case studies', async () => {
    const res = await runMapReduce(
      [doc('README.md', 's1'), doc('docs/bad.md', 's2')],
      meta,
      {
        mapFile: async (d) => {
          if (d.path === 'docs/bad.md') throw new Error('unparseable');
          return extractOf(d);
        },
        reduce: async (_e, a) => csOf(a),
      },
    );
    expect(res.mapped).toBe(1);
    expect(res.extracts.map((e) => e.path)).toEqual(['README.md']);
    expect(res.caseStudies).toHaveLength(3);
  });

  it('produces no case studies for a repo with no substantive markdown', async () => {
    const res = await runMapReduce([doc('src/x.ts', 's')], meta, {
      mapFile: async (d) => extractOf(d),
      reduce: async (_e, a) => csOf(a),
    });
    expect(res.caseStudies).toHaveLength(0);
    expect(res.mapped).toBe(0);
  });

  // --- review-hardening (adversarial code review) ---

  it('handles two files with identical content (same blob_sha) at different paths', async () => {
    const docs = [doc('a.md', 'same', 'X'), doc('b.md', 'same', 'X')];
    const mapped: string[] = [];
    const res = await runMapReduce(docs, meta, {
      mapFile: async (d) => {
        mapped.push(d.path);
        return extractOf(d);
      },
      reduce: async (_e, a) => csOf(a),
    });
    // identity is the path — both files map, neither collapses into the other
    expect(mapped.sort()).toEqual(['a.md', 'b.md']);
    expect(res.extracts.map((e) => e.path)).toEqual(['a.md', 'b.md']);
    expect(res.mapped).toBe(2);
  });

  it('reuses a cached extract only for the same path, not another file with identical content', () => {
    const docs = [doc('a.md', 'same'), doc('b.md', 'same')];
    const cached = [extractOf(doc('a.md', 'same'))];
    const { toMap, reused } = selectDocsToMap(docs, cached);
    expect(reused.map((e) => e.path)).toEqual(['a.md']);
    expect(toMap.map((d) => d.path)).toEqual(['b.md']); // same sha, different path → not reused
  });

  it('forwards repo meta to the reduce dep', async () => {
    let seen: unknown;
    await runMapReduce([doc('README.md', 's')], meta, {
      mapFile: async (d) => extractOf(d),
      reduce: (_e, a, m) => {
        seen = m;
        return Promise.resolve(csOf(a));
      },
    });
    expect(seen).toBe(meta);
  });

  it('produces no case studies when every file maps to an empty extract', async () => {
    const res = await runMapReduce([doc('README.md', 's')], meta, {
      mapFile: async (d) => ({
        path: d.path,
        blobSha: d.blobSha,
        themes: [],
        architecture: '',
        tech: [],
        userOutcomes: '',
        codeDepth: '',
      }),
      reduce: async (_e, a) => csOf(a),
    });
    expect(res.caseStudies).toHaveLength(0);
    expect(res.extracts).toHaveLength(1); // still cached, just not reduced
  });

  it('a large repo (60 files) reduces within the 128K gateway budget', async () => {
    // 60 substantive docs, each producing a realistic ~500-token extract.
    const docs = Array.from({ length: 60 }, (_v, i) =>
      doc(`docs/file-${i}.md`, `sha-${i}`, '# doc\n' + 'word '.repeat(400)),
    );
    let reducePromptChars = 0;
    const res = await runMapReduce(docs, meta, {
      mapFile: async (d) => ({
        path: d.path,
        blobSha: d.blobSha,
        themes: ['theme one', 'theme two'],
        architecture: 'a moderately detailed architecture sentence '.repeat(4),
        tech: ['TypeScript', 'Redis', 'Next.js'],
        userOutcomes: 'a clear user outcome sentence describing value '.repeat(
          3,
        ),
        codeDepth: 'deep',
      }),
      // measure the actual reduce input the 128K gateway would receive
      reduce: (extracts, a) => {
        const msgs = buildReducePrompt(extracts, a, meta);
        reducePromptChars = msgs.reduce(
          (n, m) => n + (m.content as string).length,
          0,
        );
        return Promise.resolve(csOf(a));
      },
    });
    expect(res.mapped).toBe(60);
    expect(res.caseStudies).toHaveLength(3);
    // Conservative token estimate (~3 chars/token for mixed Thai/paths) must
    // leave headroom under 128K for the model's own output.
    const estTokens = Math.ceil(reducePromptChars / 3);
    expect(estTokens).toBeLessThan(120000);
  });
});
