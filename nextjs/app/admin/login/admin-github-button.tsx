'use client';

import { useState } from 'react';
import { createClient } from '@/lib/client';

/**
 * "Log in with GitHub" for admins (Epic C — unified auth). Same Supabase OAuth flow as
 * the member login, but returns to /admin; the admin guard then admits the user if their
 * member row is flagged is_admin. The email/password form below stays as a fallback.
 */
export function AdminGithubButton() {
  const [pending, setPending] = useState(false);

  async function login() {
    setPending(true);
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'github',
      options: {
        redirectTo: `${window.location.origin}/auth/callback?next=/admin`,
      },
    });
    if (error) setPending(false);
  }

  return (
    <button type="button" className="btn" onClick={login} disabled={pending}>
      {pending ? 'กำลังพาไป GitHub…' : 'เข้าสู่ระบบด้วย GitHub'}
    </button>
  );
}
