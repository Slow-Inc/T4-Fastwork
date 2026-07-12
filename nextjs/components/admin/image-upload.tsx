'use client';

import { useState } from 'react';
import { createClient } from '@/lib/client';

/**
 * Uploads an image to the public `media` Supabase Storage bucket and exposes the
 * resulting public URL through a hidden input (Requirement §10 image upload, §7.3
 * Supabase Storage). Drops straight into any admin form.
 */
export function ImageUpload({
  name,
  defaultUrl = '',
  folder = 'uploads',
}: {
  name: string;
  defaultUrl?: string;
  folder?: string;
}) {
  const [url, setUrl] = useState(defaultUrl);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setBusy(true);
    setError(null);
    try {
      const supabase = createClient();
      const ext = file.name.split('.').pop() || 'png';
      const path = `${folder}/${crypto.randomUUID()}.${ext}`;
      const { error: upErr } = await supabase.storage
        .from('media')
        .upload(path, file, { upsert: false });
      if (upErr) throw upErr;
      const { data } = supabase.storage.from('media').getPublicUrl(path);
      setUrl(data.publicUrl);
    } catch {
      setError('อัปโหลดไม่สำเร็จ');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="field">
      <span className="t-meta">ภาพปก</span>
      <input type="file" accept="image/*" onChange={onChange} disabled={busy} />
      <input type="hidden" name={name} value={url} />
      {busy && <span className="t-meta">กำลังอัปโหลด…</span>}
      {error && <span className="field-err">{error}</span>}
      {url && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={url} alt="preview" className="admin-img-preview" />
      )}
    </div>
  );
}
