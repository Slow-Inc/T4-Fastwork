import { EMPTY_SCOPE_SUMMARY, type ScopeSummary } from './scope-summary.types';

function str(v: unknown): string | null {
  return typeof v === 'string' && v.trim().length > 0 ? v : null;
}

/**
 * Parses the LLM's scope-extraction response. Tolerant of markdown code
 * fences and malformed output — a bad response degrades to "not enough info
 * yet" rather than throwing, so a flaky LLM reply never breaks the panel.
 */
export function parseScopeSummaryResponse(raw: string): ScopeSummary {
  const match = raw.match(/\{[\s\S]*\}/);
  if (!match) return { ...EMPTY_SCOPE_SUMMARY };

  try {
    const parsed = JSON.parse(match[0]) as Record<string, unknown>;
    return {
      hasEnoughInfo: parsed.hasEnoughInfo === true,
      projectType: str(parsed.projectType),
      budgetRange: str(parsed.budgetRange),
      timeline: str(parsed.timeline),
      notes: str(parsed.notes),
    };
  } catch {
    return { ...EMPTY_SCOPE_SUMMARY };
  }
}
