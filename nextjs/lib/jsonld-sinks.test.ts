/**
 * No markup sink may serialise with a bare `JSON.stringify` (#265).
 *
 * Fixing the four known JSON-LD sinks is not enough on its own: the raw pattern is short, reads as
 * obviously correct, and is exactly what someone adds when a fifth page needs structured data. This
 * test is the part that keeps it out — it fails on the pattern, not on a list of files, so a new page
 * is covered the day it is written.
 *
 * `dangerouslySetInnerHTML` itself is legitimate here (markdown rendering uses it). What is never
 * legitimate is handing it `JSON.stringify` output directly, because that does not escape `<` and a
 * value containing a closing-tag sequence then ends the element.
 */
import { describe, expect, test } from 'bun:test';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = join(import.meta.dir, '..');
const SCANNED = ['app', 'components'];

function tsxFiles(dir: string): string[] {
  const out: string[] = [];
  for (const entry of readdirSync(dir)) {
    if (entry === 'node_modules' || entry.startsWith('.')) continue;
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) out.push(...tsxFiles(full));
    else if (entry.endsWith('.tsx') || entry.endsWith('.ts')) out.push(full);
  }
  return out;
}

const files = SCANNED.flatMap((d) => tsxFiles(join(ROOT, d)));

describe('JSON-LD and other markup sinks (#265)', () => {
  test('scans a non-trivial number of files, so a passing result means something', () => {
    // Guards against the scan silently covering nothing after a directory move.
    expect(files.length).toBeGreaterThan(50);
  });

  test('no dangerouslySetInnerHTML is fed a bare JSON.stringify', () => {
    const offenders: string[] = [];
    for (const file of files) {
      const src = readFileSync(file, 'utf8');
      let from = 0;
      for (;;) {
        const at = src.indexOf('dangerouslySetInnerHTML', from);
        if (at === -1) break;
        // The payload expression follows within a short window; a whole component never does.
        const window = src.slice(at, at + 300);
        if (window.includes('JSON.stringify')) {
          const line = src.slice(0, at).split('\n').length;
          offenders.push(`${file.slice(ROOT.length + 1)}:${line}`);
        }
        from = at + 1;
      }
    }
    expect(
      offenders,
      'These sinks serialise with a bare JSON.stringify, which does not escape `<`. Use ' +
        '`jsonLdHtml` from `@/lib/seo` instead: ' +
        offenders.join(', '),
    ).toEqual([]);
  });

  test('every ld+json script in the app uses the escaping helper', () => {
    const missing: string[] = [];
    for (const file of files) {
      const src = readFileSync(file, 'utf8');
      if (!src.includes('application/ld+json')) continue;
      if (!src.includes('jsonLdHtml')) missing.push(file.slice(ROOT.length + 1));
    }
    expect(
      missing,
      'These files emit an ld+json script without going through `jsonLdHtml`: ' +
        missing.join(', '),
    ).toEqual([]);
  });
});
