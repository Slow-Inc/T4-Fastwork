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
