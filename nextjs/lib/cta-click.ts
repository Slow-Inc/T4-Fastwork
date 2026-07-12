/** Pure validation for CTA-click analytics events (Requirement §6.7). */
export interface CtaClickValue {
  source_page: string;
  cta_type: string;
}

export type CtaClickResult = { ok: true; value: CtaClickValue } | { ok: false };

const MAX_LEN = 200;

export function parseCtaClick(body: unknown): CtaClickResult {
  if (typeof body !== 'object' || body === null) return { ok: false };

  const b = body as Record<string, unknown>;
  const sourcePage = b.source_page;
  const ctaType = b.cta_type;

  if (typeof sourcePage !== 'string' || !sourcePage || sourcePage.length > MAX_LEN) {
    return { ok: false };
  }
  if (typeof ctaType !== 'string' || !ctaType || ctaType.length > MAX_LEN) {
    return { ok: false };
  }

  return { ok: true, value: { source_page: sourcePage, cta_type: ctaType } };
}
