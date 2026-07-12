import { createClient } from '@/lib/server';
import { deletePost } from './actions';
import { PostForm } from './post-form';

export default async function AdminBlog() {
  const supabase = await createClient();
  const { data: posts } = await supabase
    .from('blog_posts')
    .select('id, title, slug, published_at')
    .order('published_at', { ascending: false });

  return (
    <div className="admin-page">
      <h1>บทความ</h1>
      <p className="t-meta">จัดการบทความบล็อก (§4.6)</p>

      <div className="admin-form-card">
        <PostForm />
      </div>

      {posts && posts.length > 0 ? (
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>หัวข้อ</th>
                <th>slug</th>
                <th>สถานะ</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {posts.map((p) => (
                <tr key={p.id}>
                  <td>{p.title}</td>
                  <td className="t-meta">{p.slug}</td>
                  <td>{p.published_at ? 'เผยแพร่' : 'ฉบับร่าง'}</td>
                  <td>
                    <form action={deletePost}>
                      <input type="hidden" name="id" value={p.id} />
                      <button type="submit" className="admin-del">ลบ</button>
                    </form>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="admin-empty">ยังไม่มีบทความ</p>
      )}
    </div>
  );
}
