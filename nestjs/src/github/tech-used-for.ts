/**
 * Per-technology "used for" blurbs (epic #127 D4 / issue #131).
 * Global on the `technologies` taxonomy row — not per-project junction.
 */
export interface TechUsedFor {
  usedFor: string;
  usedForEn: string;
}

export type UsedForOwner = 'auto' | 'human';

export function filterUsedForPatch(
  owner: UsedForOwner,
  blurb: TechUsedFor,
): TechUsedFor | null {
  if (owner !== 'auto') return null;
  return blurb;
}

export function parseTechUsedFor(raw: string): TechUsedFor {
  const jsonText = extractJsonObject(raw);
  let obj: unknown;
  try {
    obj = JSON.parse(jsonText);
  } catch {
    throw new Error('tech-used-for: model did not return valid JSON');
  }
  const o = obj as Record<string, unknown>;
  const str = (v: unknown): string => (typeof v === 'string' ? v.trim() : '');
  const result: TechUsedFor = {
    usedFor: str(o.usedFor),
    usedForEn: str(o.usedForEn),
  };
  if (!result.usedFor || !result.usedForEn) {
    throw new Error('tech-used-for: incomplete bilingual fields');
  }
  return result;
}

function extractJsonObject(raw: string): string {
  const fenced = raw.match(/```(?:json)?\s*([\s\S]*?)```/);
  const text = (fenced?.[1] ?? raw).trim();
  const start = text.indexOf('{');
  const end = text.lastIndexOf('}');
  if (start < 0 || end <= start) {
    throw new Error('tech-used-for: no JSON object in model reply');
  }
  return text.slice(start, end + 1);
}
