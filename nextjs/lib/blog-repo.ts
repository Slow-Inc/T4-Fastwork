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

/** Public blog surface: human-authored posts only (ADR 0013 / issue #133). */
export const BLOG_SELECT = 'slug,title,excerpt,content,author,tags,published_at,read_time_min,views';

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

type ListQuery = {
  neq(column: 'kind', value: 'case_study'): ListQuery;
  order(
    column: 'ai_rank' | 'published_at',
    options: { ascending: boolean; nullsFirst?: boolean },
  ): ListQuery;
  then(resolve: (v: { data: unknown[] | null; error: unknown | null }) => void): void;
};

type SlugQuery = {
  neq(column: 'kind', value: 'case_study'): SlugQuery;
  eq(column: 'slug', value: string): SlugQuery;
  maybeSingle(): Promise<{ data: unknown | null; error: unknown | null }>;
};

export interface BlogDb {
  from(table: 'blog_posts'): {
    select(columns: string): ListQuery;
  };
}

/** Narrow helper so slug lookups keep a typed `.eq` / `.maybeSingle` chain. */
export interface BlogSlugDb {
  from(table: 'blog_posts'): {
    select(columns: string): Omit<SlugQuery, 'neq'> & {
      neq(column: 'kind', value: 'case_study'): Omit<SlugQuery, 'neq'> & {
        eq(column: 'slug', value: string): {
          maybeSingle(): Promise<{ data: unknown | null; error: unknown | null }>;
        };
      };
    };
  };
}

export async function getPosts(
  q?: string,
  db: BlogDb = publicDb() as unknown as BlogDb,
): Promise<BlogPost[]> {
  try {
    const { data, error } = await db
      .from('blog_posts')
      .select(BLOG_SELECT)
      .neq('kind', 'case_study')
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

export async function getPostBySlug(
  slug: string,
  db: BlogSlugDb = publicDb() as unknown as BlogSlugDb,
): Promise<BlogPost | undefined> {
  try {
    const { data, error } = await db
      .from('blog_posts')
      .select(BLOG_SELECT)
      .neq('kind', 'case_study')
      .eq('slug', slug)
      .maybeSingle();
    if (error || !data) return staticGet(slug);
    return mapDbPost(data as unknown as DbPostRow);
  } catch {
    return staticGet(slug);
  }
}
