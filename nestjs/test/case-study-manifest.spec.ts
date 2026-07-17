import { describe, it, expect } from 'bun:test';
import {
  computeManifestHash,
  PROMPT_VERSION,
} from '../src/github/github-case-study';

// The manifest hash is the idempotency key (ADR 0009 D3): a generation run is
// skipped when (project, manifest_hash, prompt_version) already succeeded. It
// must be deterministic + independent of the order docs are read from the DB,
// and change iff a file's blob_sha changes (a content change) or the prompt
// version bumps. #66's worker recomputes it the same way to decide skip-vs-run.
describe('computeManifestHash (#81 / ADR 0009 D3 idempotency key)', () => {
  const docs = [
    { path: 'README.md', blobSha: 'aaa' },
    { path: 'docs/arch.md', blobSha: 'bbb' },
  ];

  it('is deterministic for the same docs + version', () => {
    expect(computeManifestHash(docs, 'v1')).toBe(
      computeManifestHash(docs, 'v1'),
    );
  });

  it('is independent of doc order (sorts by path+sha)', () => {
    const reordered = [docs[1], docs[0]];
    expect(computeManifestHash(reordered, 'v1')).toBe(
      computeManifestHash(docs, 'v1'),
    );
  });

  it('changes when a blob_sha changes (content change)', () => {
    const changed = [docs[0], { path: 'docs/arch.md', blobSha: 'ccc' }];
    expect(computeManifestHash(changed, 'v1')).not.toBe(
      computeManifestHash(docs, 'v1'),
    );
  });

  it('changes when a file is added or removed', () => {
    const added = [...docs, { path: 'docs/extra.md', blobSha: 'ddd' }];
    expect(computeManifestHash(added, 'v1')).not.toBe(
      computeManifestHash(docs, 'v1'),
    );
  });

  it('changes when the prompt version bumps', () => {
    expect(computeManifestHash(docs, 'v2')).not.toBe(
      computeManifestHash(docs, 'v1'),
    );
  });

  it('exposes a stable PROMPT_VERSION string', () => {
    expect(typeof PROMPT_VERSION).toBe('string');
    expect(PROMPT_VERSION.length).toBeGreaterThan(0);
  });
});
