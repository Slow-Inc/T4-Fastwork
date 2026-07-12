'use client';

import { useActionState, useEffect, useRef } from 'react';
import { createTerm, type TermState } from './actions';

const initial: TermState = {};

export function TermForm({ table, withEn }: { table: string; withEn?: boolean }) {
  const [state, action, pending] = useActionState(createTerm, initial);
  const ref = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.ok) ref.current?.reset();
  }, [state.ok]);

  return (
    <form ref={ref} action={action} className="tax-form">
      <input type="hidden" name="table" value={table} />
      <input name="name" placeholder="ชื่อใหม่…" required />
      {withEn && <input name="name_en" placeholder="EN (ไม่บังคับ)" />}
      <button type="submit" className="btn" disabled={pending}>
        {pending ? '…' : 'เพิ่ม'}
      </button>
      {state.error && <span className="field-err">{state.error}</span>}
    </form>
  );
}
