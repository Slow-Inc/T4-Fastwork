/** Mirrors nestjs/src/chat/scope-summary.types.ts (Requirement §5.4 / FR-08). */
export interface ScopeSummary {
  hasEnoughInfo: boolean;
  projectType: string | null;
  budgetRange: string | null;
  timeline: string | null;
  notes: string | null;
}

export const EMPTY_SCOPE_SUMMARY: ScopeSummary = {
  hasEnoughInfo: false,
  projectType: null,
  budgetRange: null,
  timeline: null,
  notes: null,
};

const DEFAULT_TIMELINE = 'ประเมินหลังสรุปขอบเขตงาน';

/** Turns a summary into display lines — [] until the AI has enough info to show anything. */
export function scopeSummaryLines(s: ScopeSummary): { label: string; value: string }[] {
  if (!s.hasEnoughInfo) return [];

  const lines: { label: string; value: string }[] = [];
  if (s.projectType) lines.push({ label: 'ประเภทงาน', value: s.projectType });
  if (s.budgetRange) lines.push({ label: 'งบประมาณเบื้องต้น', value: s.budgetRange });
  lines.push({ label: 'ระยะเวลา', value: s.timeline ?? DEFAULT_TIMELINE });
  if (s.notes) lines.push({ label: 'requirement เพิ่มเติม', value: s.notes });
  return lines;
}

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:4100';

export async function fetchScopeSummary(sessionId: string): Promise<ScopeSummary> {
  const res = await fetch(`${API_BASE}/chat/scope-summary`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ sessionId }),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return (await res.json()) as ScopeSummary;
}
