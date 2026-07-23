import type { CSSProperties } from 'react';

/** Canonical GitHub language colours (subset); unknowns fall back to a palette. */
const LANG_COLORS: Record<string, string> = {
  TypeScript: '#3178c6',
  JavaScript: '#f1e05a',
  CSS: '#563d7c',
  HTML: '#e34c26',
  Python: '#3572A5',
  Dart: '#00B4AB',
  Go: '#00ADD8',
  Rust: '#dea584',
  Java: '#b07219',
  Kotlin: '#A97BFF',
  Swift: '#F05138',
  'C++': '#f34b7d',
  C: '#555555',
  'C#': '#178600',
  Ruby: '#701516',
  PHP: '#4F5D95',
  Shell: '#89e051',
  Vue: '#41b883',
  Svelte: '#ff3e00',
  SCSS: '#c6538c',
  Dockerfile: '#384d54',
  Astro: '#ff5a03',
};
const FALLBACK = ['#8b7cff', '#4fd1c5', '#f6ad55', '#fc8181', '#68d391', '#63b3ed'];

function colorFor(name: string, i: number): string {
  return LANG_COLORS[name] ?? FALLBACK[i % FALLBACK.length];
}

interface Props {
  /** GitHub `{ language: bytes }` map. */
  languages: Record<string, number>;
  /** Locale for the a11y label. */
  en?: boolean;
}

/**
 * Language-proportion donut for the project detail. Pure SVG (no chart lib):
 * one ring segment per language sized by its byte share, plus a labelled legend.
 * Collapses the long tail into "อื่น ๆ / Other" so the ring stays readable.
 */
export function LanguageDonut({ languages, en }: Props) {
  const entries = Object.entries(languages)
    .filter(([, bytes]) => bytes > 0)
    .sort((a, b) => b[1] - a[1]);
  const total = entries.reduce((s, [, b]) => s + b, 0);
  if (total === 0 || entries.length === 0) return null;

  // Keep the top 5; fold the rest into a single "Other" slice.
  const TOP = 5;
  const shown = entries.slice(0, TOP);
  const restBytes = entries.slice(TOP).reduce((s, [, b]) => s + b, 0);
  const slices = shown.map(([name, bytes], i) => ({
    name,
    pct: (bytes / total) * 100,
    color: colorFor(name, i),
  }));
  if (restBytes > 0) {
    slices.push({
      name: en ? 'Other' : 'อื่น ๆ',
      pct: (restBytes / total) * 100,
      color: '#4a4a55',
    });
  }

  const r = 42;
  const C = 2 * Math.PI * r;
  // Arc length + cumulative start offset per slice, computed immutably.
  const lens = slices.map((s) => (s.pct / 100) * C);
  const offsets = lens.map((_, i) =>
    lens.slice(0, i).reduce((a, b) => a + b, 0),
  );

  return (
    <div className="lang-donut">
      <svg
        viewBox="0 0 100 100"
        className="lang-donut__ring"
        role="img"
        aria-label={
          (en ? 'Language breakdown: ' : 'สัดส่วนภาษา: ') +
          slices.map((s) => `${s.name} ${s.pct.toFixed(0)}%`).join(', ')
        }
      >
        {slices.map((s, i) => (
          <circle
            key={s.name}
            cx="50"
            cy="50"
            r={r}
            fill="none"
            stroke={s.color}
            strokeWidth="14"
            strokeDasharray={`${lens[i]} ${C - lens[i]}`}
            strokeDashoffset={-offsets[i]}
            transform="rotate(-90 50 50)"
          />
        ))}
        <text
          x="50"
          y="48"
          textAnchor="middle"
          className="lang-donut__center-value"
          aria-hidden="true"
        >
          {entries.length}
        </text>
        <text
          x="50"
          y="59"
          textAnchor="middle"
          className="lang-donut__center-label"
          aria-hidden="true"
        >
          {en ? (entries.length === 1 ? 'language' : 'languages') : 'ภาษา'}
        </text>
      </svg>
      <ul className="lang-donut__legend">
        {slices.map((s) => (
          <li key={s.name}>
            <span
              className="lang-donut__dot"
              style={{ '--dot': s.color } as CSSProperties}
              aria-hidden
            />
            <span className="lang-donut__name">{s.name}</span>
            <span className="lang-donut__pct">{s.pct.toFixed(1)}%</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
