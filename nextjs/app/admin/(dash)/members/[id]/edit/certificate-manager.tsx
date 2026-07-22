'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/client';
import { ImageUpload } from '@/components/admin/image-upload';
import type { EditableCertificate } from '@/lib/member-session';

/**
 * Admin management of a member's certificates (flat authz — no approval step). An admin
 * adds/removes certificates for the TARGET member and they publish directly
 * (`status='published'`); RLS (0024) permits any admin to write any member's certs and
 * grants the `status` column. Assets upload to the public `media` bucket.
 */
export function MemberCertificateManager({
  memberId,
  initial,
}: {
  memberId: number;
  initial: EditableCertificate[];
}) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  async function add(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const fd = new FormData(form);
    const issuer = String(fd.get('issuer') ?? '').trim();
    const title = String(fd.get('title') ?? '').trim();
    const assetWebp = String(fd.get('asset_webp') ?? '').trim();
    const assetPdf = String(fd.get('asset_pdf') ?? '').trim();
    if (!issuer || !title) {
      setMsg('กรอกผู้ออกและชื่อใบรับรอง');
      return;
    }
    setPending(true);
    setMsg(null);
    const supabase = createClient();
    const { error } = await supabase.from('member_certificates').insert({
      member_id: memberId,
      issuer,
      title,
      asset_webp: assetWebp || null,
      asset_pdf: assetPdf || null,
      status: 'published',
    });
    setPending(false);
    if (error) {
      setMsg('เพิ่มไม่สำเร็จ');
      return;
    }
    form.reset();
    setMsg('เพิ่มแล้ว ✓');
    router.refresh();
  }

  async function remove(id: number) {
    const supabase = createClient();
    const { error } = await supabase
      .from('member_certificates')
      .delete()
      .eq('id', id);
    setMsg(error ? 'ลบไม่สำเร็จ' : 'ลบแล้ว');
    if (!error) router.refresh();
  }

  return (
    <div className="member-certs">
      {initial.length > 0 && (
        <ul className="member-cert-list">
          {initial.map((c) => (
            <li key={c.id} className="member-cert-item">
              <span className="member-cert-title">
                {c.issuer} — {c.title}
              </span>
              <span
                className={`member-cert-status member-cert-status-${c.status}`}
              >
                {c.status === 'published' ? 'เผยแพร่แล้ว' : 'ฉบับร่าง'}
              </span>
              <button
                type="button"
                className="admin-del"
                onClick={() => remove(c.id)}
              >
                ลบ
              </button>
            </li>
          ))}
        </ul>
      )}

      <form onSubmit={add} className="member-form">
        <label className="field">
          <span className="t-meta">ผู้ออกใบรับรอง</span>
          <input type="text" name="issuer" />
        </label>
        <label className="field">
          <span className="t-meta">ชื่อใบรับรอง</span>
          <input type="text" name="title" />
        </label>
        <ImageUpload
          name="asset_webp"
          label="ภาพใบรับรอง"
          folder="member-certs"
          accept="image/*"
        />
        <ImageUpload
          name="asset_pdf"
          label="ไฟล์ PDF (ถ้ามี)"
          folder="member-certs"
          accept="application/pdf"
        />
        {msg && <p className="t-meta">{msg}</p>}
        <button type="submit" className="btn" disabled={pending}>
          {pending ? 'กำลังเพิ่ม…' : 'เพิ่มใบรับรอง'}
        </button>
      </form>
    </div>
  );
}
