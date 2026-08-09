/**
 * Which browser console message fails an E2E test (#278).
 *
 * The "no console errors" contract exists to catch hydration/runtime bugs, but third-party
 * resource-load failures are not our bug and must not red the suite: team profile pages and project
 * READMEs embed external badges (shields.io, github-readme-stats, skillicons…) that rate-limit or 5xx
 * intermittently. A console message's *location* is the document URL, not the failed resource's URL —
 * the old "ignore if the URL is cross-origin" check compared the page to itself and never ignored
 * anything — so resource-load noise is dropped on the message text. Genuinely broken same-origin
 * assets are still caught by the layout/content assertions and by `pageerror`.
 */

/**
 * @param messageType the console message type (`log`, `warning`, `error`, …).
 * @param text the message text.
 * @param locationUrl the console message's location URL, if any (the document, not the resource).
 * @param pageUrl the page the test is on.
 */
export function shouldRecordConsoleError(
  messageType: string,
  text: string,
  locationUrl?: string,
  pageUrl?: string,
): boolean {
  if (messageType !== 'error') return false;
  if (/Failed to load resource/i.test(text)) return false;
  // Best effort, when the location genuinely names a cross-origin script: still ignore.
  if (locationUrl && pageUrl) {
    try {
      if (new URL(locationUrl).origin !== new URL(pageUrl).origin) return false;
    } catch {
      // Unparseable URL → treat as first-party and record (conservative).
    }
  }
  return true;
}
