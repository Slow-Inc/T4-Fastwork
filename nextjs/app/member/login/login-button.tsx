'use client';

import { useState } from 'react';
import { createClient } from '@/lib/client';

/** "Log in with GitHub" — starts the Supabase OAuth flow (Epic C / C2). */
export function MemberLoginButton() {
  const [pending, setPending] = useState(false);

  async function login() {
    setPending(true);
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'github',
      options: {
        redirectTo: `${window.location.origin}/auth/callback?next=/member`,
      },
    });
    // On success the browser is redirected to GitHub; only errors return here.
    if (error) setPending(false);
  }

  return (
    <button type="button" className="btn" onClick={login} disabled={pending}>
      {pending ? 'กำลังพาไป GitHub…' : 'เข้าสู่ระบบด้วย GitHub'}
    </button>
  );
}
