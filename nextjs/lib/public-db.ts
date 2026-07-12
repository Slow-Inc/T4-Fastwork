import { createServerClient } from '@supabase/ssr';

/**
 * Cookieless Supabase client for reading PUBLIC content at render time. Because
 * it never touches next/headers cookies, pages that use it stay statically
 * generated / ISR-cached (revalidated on demand from admin actions) instead of
 * being forced into per-request dynamic rendering.
 */
export function publicDb() {
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: { getAll: () => [], setAll: () => {} },
    },
  );
}
