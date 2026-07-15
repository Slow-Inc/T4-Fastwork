import { metrics } from "@/content/site";

/** Hero credibility metric band (Requirement §4.1.2). Numeric values carry a
 * `data-countup` hook that <CountUpObserver> animates from 0 on scroll-in; the
 * rendered text is the final value, so SSR / no-JS / reduced-motion are correct. */
export function MetricBand() {
  return (
    <div className="band rv">
      {metrics.map((m) => (
        <div className="m" key={m.label}>
          <div className="n" data-countup>
            {m.value}
          </div>
          <div className="l t-meta">{m.label}</div>
        </div>
      ))}
    </div>
  );
}
