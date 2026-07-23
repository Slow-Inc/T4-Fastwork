/**
 * Structured AI overview card for a project (epic #127 D3 / issue #130).
 * Distinct from `projects.content` (deep-detail narrative) and from the short
 * CMS `description` lead.
 */
export interface ProjectOverview {
  /** ภาพรวม — what the project is */
  summary: string;
  /** สรุป 30 วินาที — short highlights */
  highlights: string;
  /** เหมาะกับใคร — who it is for */
  goodFor: string;
  summaryEn: string;
  highlightsEn: string;
  goodForEn: string;
}

export type OverviewOwner = 'auto' | 'human';

/** Keep only auto-owned overview fields from a reviewed/generated patch. */
export function filterOverviewPatch(
  owner: OverviewOwner,
  overview: ProjectOverview,
): ProjectOverview | null {
  if (owner !== 'auto') return null;
  return overview;
}

export function parseProjectOverview(raw: string): ProjectOverview {
  const jsonText = extractJsonObject(raw);
  let obj: unknown;
  try {
    obj = JSON.parse(jsonText);
  } catch {
    throw new Error('overview: model did not return valid JSON');
  }
  const o = obj as Record<string, unknown>;
  const str = (v: unknown): string => (typeof v === 'string' ? v.trim() : '');
  const result: ProjectOverview = {
    summary: str(o.summary),
    highlights: str(o.highlights),
    goodFor: str(o.goodFor),
    summaryEn: str(o.summaryEn),
    highlightsEn: str(o.highlightsEn),
    goodForEn: str(o.goodForEn),
  };
  if (
    !result.summary ||
    !result.highlights ||
    !result.goodFor ||
    !result.summaryEn ||
    !result.highlightsEn ||
    !result.goodForEn
  ) {
    throw new Error('overview: incomplete structured fields');
  }
  return result;
}

function extractJsonObject(raw: string): string {
  const fenced = raw.match(/```(?:json)?\s*([\s\S]*?)```/);
  const text = (fenced?.[1] ?? raw).trim();
  const start = text.indexOf('{');
  const end = text.lastIndexOf('}');
  if (start < 0 || end <= start) {
    throw new Error('overview: no JSON object in model reply');
  }
  return text.slice(start, end + 1);
}
