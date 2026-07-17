import { describe, it, expect } from 'bun:test';
import {
  curateDocuments,
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
