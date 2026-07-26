/**
 * The audit window is a UTC day boundary, and the report has to say so (#259).
 *
 * `mergedAt` comes from GitHub in UTC; the documented session-start recipe passes a *local* calendar
 * date. On a UTC+7 machine that silently excludes anything merged before 07:00 local — measured on PR
 * #258, which merged `2026-07-26T23:28:03Z` at `2026-07-27 06:31` local and therefore fell outside
 * `--since 2026-07-27`. The tool never claimed those zero PRs were a pass, but "audited 0" over a window
 * the operator believed covered today reads like one, so the window itself has to be stated.
 */
import { describe, expect, it } from 'bun:test';
import { describeAuditWindow, inMergeWindow } from '../src/github/gate-audit';

describe('inMergeWindow — the boundary is a UTC calendar day (#259)', () => {
  it('excludes a PR whose UTC date is a day behind the local date it was merged on', () => {
    // The real case: 2026-07-26T23:28:03Z is 2026-07-27 06:31 at UTC+7.
    expect(inMergeWindow('2026-07-26T23:28:03Z', '2026-07-27')).toBe(false);
  });

  it('includes that same PR when --since names its UTC date', () => {
    expect(inMergeWindow('2026-07-26T23:28:03Z', '2026-07-26')).toBe(true);
  });

  it('includes everything merged when no window is given', () => {
    expect(inMergeWindow('2020-01-01T00:00:00Z', undefined)).toBe(true);
  });

  it('excludes a PR that is not merged at all', () => {
    expect(inMergeWindow(null, undefined)).toBe(false);
  });
});

describe('describeAuditWindow — an empty window may not read as a clean day (#259)', () => {
  it('names the window and its timezone when one was given', () => {
    const line = describeAuditWindow(16, '2026-07-26');
    expect(line).toContain('16');
    expect(line).toContain('2026-07-26');
    expect(line).toContain('UTC');
  });

  it('says nothing was checked, not that nothing was wrong, on an empty window', () => {
    const line = describeAuditWindow(0, '2026-07-27');
    expect(line).toContain('nothing was checked');
    // The operator's mistake is a local date; the fix has to be reachable from the message itself.
    expect(line.toLowerCase()).toContain('local');
  });

  it('omits the window clause entirely when no --since was passed', () => {
    expect(describeAuditWindow(30, undefined)).not.toContain('UTC');
  });
});
