/**
 * Single source of truth for "does this project need a cover capture for this trigger?" (#197).
 *
 * Imported by BOTH sides of the capture pipeline — the Nest planner
 * (`project-automation-sync.ts`) and the Action-side worker selection
 * (`nextjs/lib/snapshot-cover.ts`). They used to carry their own copy of this rule and
 * disagreed, which made recapture impossible for any project that already had a cover.
 *
 * `lastCompletedTrigger` is the trigger of the last capture that actually COMPLETED, and is
 * written only by the worker after a successful upload. Nest must never write it at dispatch
 * time: the worker boots ~30-60s after the dispatch and compares against this value, so a
 * dispatch-time write makes the two sides see the same trigger and capture nothing.
 *
 * Pure and dependency-free on purpose — it is imported across the workspace boundary.
 */

export interface CoverCaptureInput {
  /** The project currently has a cover image. */
  hasCover: boolean;
  /** Trigger of the last COMPLETED capture (worker-written), or null if never captured. */
  lastCompletedTrigger: string | null;
  /** Trigger of the event being considered (`push:<sha>` | `deploy:<id>` | `manual`). */
  incomingTrigger: string | null;
  /** Manual override — bypasses both gates. */
  force?: boolean;
}

export function needsCoverCapture(input: CoverCaptureInput): boolean {
  if (input.force === true) return true;
  // No cover at all: capture regardless of triggers.
  if (!input.hasCover) return true;
  const incoming = input.incomingTrigger;
  // Nothing identifies this event, so it cannot be told apart from the last one.
  if (incoming == null || incoming === '') return false;
  return incoming !== (input.lastCompletedTrigger ?? null);
}
