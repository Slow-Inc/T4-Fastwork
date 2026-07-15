import 'server-only';
import { publicDb } from '@/lib/public-db';
import { searchPosts as staticSearch, getPost as staticGet, type BlogPost } from '@/content/blog';

export interface DbPostRow {
  slug: string;
  title: string;
  excerpt: string | null;
  content: string | null;
  author: string | null;
  tags: string[] | null;
  published_at: string | null;
  read_time_min: number | null;
  views: number | null;
}

export function mapDbPost(row: DbPostRow): BlogPost {
  return {
    slug: row.slug,
    title: row.title,
    excerpt: row.excerpt ?? '',
    content: row.content ? row.content.split('\n\n').filter(Boolean) : [],
    author: row.author ?? 'T4 Labs',
    tags: row.tags ?? [],
    publishedAt: row.published_at ?? '',
    readTimeMin: row.read_time_min ?? 5,
    views: row.views ?? 0,
  };
}

const SELECT = 'slug,title,excerpt,content,author,tags,published_at,read_time_min,views';

export async function getPosts(q?: string): Promise<BlogPost[]> {
  try {
    const supabase = publicDb();
    const { data, error } = await supabase
      .from('blog_posts')
      .select(SELECT)
      // AI display-rank (views + content) leads; recency breaks ties / unranked.
      .order('ai_rank', { ascending: true, nullsFirst: false })
      .order('published_at', { ascending: false });
    if (error || !data || data.length === 0) return staticSearch(q);
    let posts = (data as unknown as DbPostRow[]).map(mapDbPost);
    const query = q?.trim().toLowerCase();
    if (query) {
      posts = posts.filter((p) =>
        `${p.title} ${p.excerpt} ${p.tags.join(' ')}`.toLowerCase().includes(query),
      );
    }
    return posts;
  } catch {
    return staticSearch(q);
  }
}

export async function getPostBySlug(slug: string): Promise<BlogPost | undefined> {
  try {
    const supabase = publicDb();
    const { data, error } = await supabase
      .from('blog_posts')
      .select(SELECT)
      .eq('slug', slug)
      .maybeSingle();
    if (error || !data) return staticGet(slug);
    return mapDbPost(data as unknown as DbPostRow);
  } catch {
    return staticGet(slug);
  }
}
