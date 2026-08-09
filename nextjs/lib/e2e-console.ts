/**
 * Which browser console messages fail an E2E test (#278).
 *
 * The "no console errors" contract exists to catch hydration/runtime bugs, but third-party
 * resource-load failures are not our bug and must not red the suite: team profile pages and project
 * READMEs embed external badges (shields.io, github-readme-stats, skillicons…) that rate-limit or 5xx
 * intermittently. A console message's *location* is the document URL, not the failed resource's URL,
 * so a cross-origin check compares the page to itself; resource-load noise is therefore dropped on
 * the message text. A `requestfailed`-based first-party check was tried and reverted — it reddened 20
 * tests in this heavily-mocked, heavily-navigating suite (aborts and expected-missing assets look
 * indistinguishable from real breakage). Genuine breakage is still caught by `pageerror`, by every
 * other console `error`, and by the layout/content assertions.
 */

/**
 * @param messageType the console message type (`log`, `warning`, `error`, …).
 * @param text the message text.
 */
export function shouldRecordConsoleError(messageType: string, text: string): boolean {
  if (messageType !== 'error') return false;
  if (/Failed to load resource/i.test(text)) return false;
  return true;
}
