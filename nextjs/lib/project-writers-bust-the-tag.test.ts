/**
 * Structural invariant: nothing revalidates a project path without releasing the cached list (#239).
 *
 * The unit tests next door prove the two helpers do both halves. They cannot prove that the NEXT
 * project writer someone adds goes through a helper — and a writer that calls `revalidatePath` by
 * hand looks completely correct in review while serving pre-write content for up to the 600 s
 * ceiling. That silent-staleness is the failure mode #239 exists to close, so it is pinned here by
 * scanning the writer surface rather than by trusting the convention.
 *
 * The check is deliberately narrow: only `/projects*` path literals matter. A file may revalidate
 * `/admin/members`, `/blog`, `/faq` by hand — those surfaces carry no cached project list.
 */
import { describe, expect, it } from 'bun:test';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = join(import.meta.dir, '..');
const HELPER_MODULE = 'lib/revalidate-project';

/** Every server file that could be a project writer: the admin/member action modules and the
 * route handlers. Walked from disk so a newly added `actions.ts` is covered the day it lands. */
function serverWriterFiles(dir: string, found: string[] = []): string[] {
  for (const entry of readdirSync(dir)) {
    if (entry === 'node_modules' || entry === '.next') continue;
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) {
      serverWriterFiles(full, found);
      continue;
    }
    if (/^(actions|route)\.tsx?$/.test(entry)) found.push(full);
  }
  return found;
}

const files = serverWriterFiles(join(ROOT, 'app'));

describe('project writers go through the revalidate-project helper (#239)', () => {
  it('finds the writer surface at all — a passing empty scan would be worthless', () => {
    expect(files.length).toBeGreaterThan(5);
  });

  it.each(files.map((f) => [f.slice(ROOT.length + 1).replace(/\\/g, '/'), f] as const))(
    '%s',
    (_label, file) => {
      const src = readFileSync(file, 'utf8');
      // Two shapes of hand-rolled project revalidation, and the second is why this scan reads the
      // source instead of just the path literals: `/api/revalidate/route.ts` never wrote
      // `revalidatePath('/projects')` — it looped over `revalidationTargets(slug)`, so a
      // literal-only check passed it while it was still leaving the cached list in place.
      const handRolled =
        /revalidatePath\(\s*['"`]\/projects/.test(src) ||
        /revalidationTargets\(/.test(src);
      if (!handRolled) return;
      expect(
        src.includes(HELPER_MODULE) || src.includes('revalidate-project'),
        `${file} revalidates a /projects path by hand — the cached list (PROJECTS_CACHE_TAG) is ` +
          `never released, so the write stays invisible until the TTL ceiling. Call ` +
          `revalidateProjectFromAction / revalidateProjectFromRouteHandler instead.`,
      ).toBe(true);
    },
  );
});
