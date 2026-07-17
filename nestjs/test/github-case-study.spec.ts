import { describe, it, expect } from 'bun:test';
import {
  curateDocuments,
  buildMapPrompt,
  parseFileExtract,
  type ProjectDocument,
} from '../src/github/github-case-study';

const doc = (path: string, blobSha = 'sha', markdown = '# x'): ProjectDocument => ({
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
    const user = buildMapPrompt(
      doc('big.md', 'sha', 'y'.repeat(200000)),
    )[1].content as string;
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
