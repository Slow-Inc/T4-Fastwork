'use client';

/** Reset-view control for the hero robot (§14.2.1 — interactions must always
 *  be recoverable). Fires the event the robot stage listens for. */
export function Lab4ResetButton() {
  return (
    <button
      type="button"
      className="lab4-reset"
      onClick={() => window.dispatchEvent(new Event('lab4-robot-reset'))}
    >
      RESET VIEW
    </button>
  );
}
