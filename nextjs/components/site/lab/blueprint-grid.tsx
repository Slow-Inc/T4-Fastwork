/**
 * Blueprint grid + four corner registration marks — the "technical spec-sheet"
 * framing that makes the ChainGPT labs layout read as engineered, not cluttered.
 * The grid lines come from a CSS background on `.blueprint-grid`; the four small
 * accent squares are the corner marks. Purely decorative → aria-hidden.
 */
export function BlueprintGrid() {
  return (
    <div className="blueprint-grid" aria-hidden="true">
      <span className="bp-corner bp-tl" />
      <span className="bp-corner bp-tr" />
      <span className="bp-corner bp-bl" />
      <span className="bp-corner bp-br" />
    </div>
  );
}
