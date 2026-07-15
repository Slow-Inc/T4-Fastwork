import { NextResponse } from 'next/server';
import { createClient } from '@/lib/server';

/**
 * OAuth callback (Epic C / C2). Supabase redirects here after GitHub sign-in with
 * a `code`; we exchange it for a session, then call the SECURITY DEFINER
 * `link_current_member()` RPC — which links this GitHub login to its member row
 * (a no-op for a non-member), so it can only ever claim the caller's own row.
 * Then redirect to `next` (default the member area).
 */
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const next = searchParams.get('next') ?? '/member';

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      await supabase.rpc('link_current_member');
      // Only redirect within our own origin (avoid open-redirect via `next`).
      const dest = next.startsWith('/') ? next : '/member';
      return NextResponse.redirect(`${origin}${dest}`);
    }
  }
  return NextResponse.redirect(`${origin}/member/login?error=auth`);
}
