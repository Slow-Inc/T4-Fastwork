'use server';

import { createClient } from '@/lib/server';
import { parseCtaClick } from '@/lib/cta-click';

/**
 * Fire-and-forget CTA-click analytics (Requirement §6.7 / §10). Called
 * directly from client onClick handlers (not via a <form>), so it never
 * blocks navigation — failures are swallowed rather than surfaced.
 */
export async function trackCtaClick(sourcePage: string, ctaType: string): Promise<void> {
  const result = parseCtaClick({ source_page: sourcePage, cta_type: ctaType });
  if (!result.ok) return;

  try {
    const supabase = await createClient();
    await supabase.from('cta_clicks').insert(result.value);
  } catch {
    // Analytics is best-effort; never let a tracking failure affect the user.
  }
}
