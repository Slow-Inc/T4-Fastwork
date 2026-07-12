import Link from 'next/link';
import { notFound } from 'next/navigation';
import { createClient } from '@/lib/server';
import { EditProjectForm } from './edit-form';

type Params = Promise<{ id: string }>;

export default async function EditProjectPage({ params }: { params: Params }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: project } = await supabase
    .from('projects')
    .select('id, title, title_en, description, content, live_url, is_featured, published_at')
    .eq('id', Number(id))
    .maybeSingle();

  if (!project) notFound();

  return (
    <div className="admin-page">
      <div className="admin-page-head">
        <h1>แก้ไขผลงาน</h1>
        <Link href="/admin/projects" className="btn ghost">← กลับ</Link>
      </div>
      <EditProjectForm project={project} />
    </div>
  );
}
