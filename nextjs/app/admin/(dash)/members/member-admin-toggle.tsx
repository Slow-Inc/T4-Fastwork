'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/client';

/**
 * Grant/revoke a member's admin flag (Epic C — unified auth). Calls the SECURITY
 * DEFINER RPC `admin_set_member_admin`, which is gated to admins (is_app_admin) so a
 * non-admin can't self-elevate even if they reach this control.
 */
export function MemberAdminToggle({
  memberId,
  initial,
}: {
  memberId: number;
  initial: boolean;
}) {
  const router = useRouter();
  const [isAdmin, setIsAdmin] = useState(initial);
  const [pending, setPending] = useState(false);

  async function toggle(next: boolean) {
    setPending(true);
    setIsAdmin(next);
    const supabase = createClient();
    const { error } = await supabase.rpc('admin_set_member_admin', {
      p_id: memberId,
      p_is_admin: next,
    });
    setPending(false);
    if (error) {
      setIsAdmin(!next);
    } else {
      router.refresh();
    }
  }

  return (
    <label className="field-row" style={{ margin: 0 }}>
      <input
        type="checkbox"
        checked={isAdmin}
        disabled={pending}
        onChange={(e) => toggle(e.target.checked)}
      />
      <span className="t-meta">Admin</span>
    </label>
  );
}
