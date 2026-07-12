import { metrics } from '@/content/site';

/** Hero credibility metric band (Requirement §4.1.2). */
export function MetricBand() {
  return (
    <div className="band rv">
      {metrics.map((m) => (
        <div className="m" key={m.label}>
          <div className="n">{m.value}</div>
          <div className="l t-meta">{m.label}</div>
        </div>
      ))}
    </div>
  );
}
