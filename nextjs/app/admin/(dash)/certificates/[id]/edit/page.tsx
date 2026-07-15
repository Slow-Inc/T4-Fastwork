import Link from 'next/link';
import { notFound } from 'next/navigation';
import { createClient } from '@/lib/server';
import { EditCertForm } from './edit-cert-form';

type Params = Promise<{ id: string }>;

export default async function EditCertPage({ params }: { params: Params }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: cert } = await supabase
    .from('certificates')
    .select(
      'id, title, title_en, issuer, issued_year, issuer_logo, thumbnail, full_image, verify_url, is_featured, sort_order',
    )
    .eq('id', Number(id))
    .maybeSingle();

  if (!cert) notFound();

  return (
    <div className="admin-page">
      <div className="admin-page-head">
        <h1>แก้ไขใบรับรอง</h1>
        <Link href="/admin/certificates" className="btn ghost">
          ← กลับ
        </Link>
      </div>
      <EditCertForm cert={cert} />
    </div>
  );
}
