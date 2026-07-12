import 'server-only';
import { publicDb } from '@/lib/public-db';
import { projects as staticProjects, type Project } from '@/content/catalog';
import { mapDbProject, mergeProjects, type DbProjectRow } from './project-map';

/**
 * Projects data access (Requirement §10 / §12). The rich curated catalog is the
 * base; projects created in the admin CMS (new slugs in the DB) are merged in so
 * they appear on the public site without a redeploy. Any DB/env failure falls
 * back to the static catalog, so the site never breaks.
 */

const SELECT =
  'slug,title,title_en,description,content,live_url,snapshot_image,is_featured,published_at,' +
  'category:categories(name),' +
  'project_technologies(technologies(name)),' +
  'project_tags(tags(name))';

export async function getAllProjects(): Promise<Project[]> {
  try {
    const supabase = publicDb();
    const { data, error } = await supabase
      .from('projects')
      .select(SELECT)
      .not('published_at', 'is', null);
    if (error || !data) return staticProjects;
    const dbProjects = (data as unknown as DbProjectRow[]).map(mapDbProject);
    return mergeProjects(staticProjects, dbProjects);
  } catch {
    return staticProjects;
  }
}

export async function getProjectBySlug(slug: string): Promise<Project | undefined> {
  const fromStatic = staticProjects.find((p) => p.slug === slug);
  if (fromStatic) return fromStatic;
  try {
    const supabase = publicDb();
    const { data, error } = await supabase
      .from('projects')
      .select(SELECT)
      .eq('slug', slug)
      .not('published_at', 'is', null)
      .maybeSingle();
    if (error || !data) return undefined;
    return mapDbProject(data as unknown as DbProjectRow);
  } catch {
    return undefined;
  }
}
