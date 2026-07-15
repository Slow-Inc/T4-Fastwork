import Link from 'next/link';
import { notFound } from 'next/navigation';
import { createClient } from '@/lib/server';
import { EditPostForm } from './edit-post-form';

type Params = Promise<{ id: string }>;

export default async function EditPostPage({ params }: { params: Params }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: post } = await supabase
    .from('blog_posts')
    .select('id, title, slug, excerpt, content, read_time_min, tags, published_at')
    .eq('id', Number(id))
    .maybeSingle();

  if (!post) notFound();

  return (
    <div className="admin-page">
      <div className="admin-page-head">
        <h1>แก้ไขบทความ</h1>
        <Link href="/admin/blog" className="btn ghost">
          ← กลับ
        </Link>
      </div>
      <EditPostForm post={post} />
    </div>
  );
}
