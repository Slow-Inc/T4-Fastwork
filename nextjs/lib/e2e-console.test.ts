/**
 * `shouldRecordConsoleError` — which browser console messages fail an E2E test (#278).
 *
 * The suite's "no console errors" contract exists to catch hydration/runtime bugs, but it is
 * currently defeated by third-party resource-load noise: team profile pages and project READMEs
 * embed external badges (shields.io, github-readme-stats, skillicons…) that rate-limit or 5xx
 * intermittently, and Chrome logs `Failed to load resource: … 429` for each. A console message
 * carries the *document* URL in its location, not the failed resource's URL, so the old
 * "ignore if the URL is cross-origin" check compared the page to itself and never ignored anything.
 *
 * Expected values come from the contract in the function's comment: real runtime errors fail the
 * test; resource-load network noise does not (the layout/content assertions still catch a genuinely
 * broken same-origin asset).
 */
import { describe, expect, it } from 'bun:test';
import { shouldRecordConsoleError } from '../lib/e2e-console';

describe('shouldRecordConsoleError (#278)', () => {
  it('ignores non-error message types', () => {
    expect(shouldRecordConsoleError('warning', 'something went sideways')).toBe(false);
    expect(shouldRecordConsoleError('log', 'hello')).toBe(false);
  });

  it('records a real error message', () => {
    expect(
      shouldRecordConsoleError(
        'error',
        'Minified React error #418; visit https://reactjs.org/docs/error-decoder.html',
      ),
    ).toBe(true);
  });

  it('ignores a rate-limited third-party resource (the flakiness this fixes)', () => {
    expect(
      shouldRecordConsoleError(
        'error',
        'Failed to load resource: the server responded with a status of 429 ()',
      ),
    ).toBe(false);
  });

  it('ignores any resource-load failure, whatever the status', () => {
    expect(
      shouldRecordConsoleError('error', 'Failed to load resource: the server responded with a status of 404'),
    ).toBe(false);
    expect(
      shouldRecordConsoleError('error', 'Failed to load resource: net::ERR_NAME_NOT_RESOLVED'),
    ).toBe(false);
  });

  it('still ignores a cross-origin error when a distinct location URL is available (best effort)', () => {
    expect(
      shouldRecordConsoleError('error', 'custom widget blew up', 'https://third-party.example/x.js', 'https://t4labs.dev/'),
    ).toBe(false);
  });

  it('records a same-origin error even with a location URL', () => {
    expect(
      shouldRecordConsoleError('error', 'custom widget blew up', 'https://t4labs.dev/_next/x.js', 'https://t4labs.dev/'),
    ).toBe(true);
  });
});
