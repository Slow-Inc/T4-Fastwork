/**
 * Project view model + pure list helpers for the DB-only showcase.
 *
 * Project DATA now lives entirely in the database (admin-editable) — see
 * `lib/projects-repo.ts`. This module keeps only the shared `Project` shape and the
 * pure filter/facet helpers that operate on a project list fetched from the DB
 * (used by /projects). No hardcoded catalog remains (dev decision 2026-07-23).
 */
export interface Project {
  slug: string;
  title: string;
  titleEn: string;
  description: string;
  descriptionEn?: string;
  /** D3 structured AI overview — falls back to `description` when absent. */
  overview?: {
    summary: string;
    highlights: string;
    goodFor: string;
    summaryEn?: string;
    highlightsEn?: string;
    goodForEn?: string;
  };
  /** Full rich description, one paragraph per entry. */
  content: string[];
  category: string;
  tags: string[];
  technologies: string[];
  /** D4 per-tech "used for" blurbs keyed by technology name. */
  technologyDetails?: Array<{
    name: string;
    usedFor?: string;
    usedForEn?: string;
  }>;
  liveUrl?: string;
  videoUrl?: string;
  /** Cover image URL (e.g. uploaded via the CMS); falls back to a tone tile. */
  snapshotImage?: string;
  isFeatured: boolean;
  /** Visual tone for the snapshot placeholder (reuses the homepage palette). */
  tone: 'ink' | 'sand' | 'teal' | 'gray';
  year: string;
  /** GitHub repo backing this project — enables the live detail overlay (stars,
   * contributors, README). Absent for non-GitHub work. */
  github?: { owner: string; repo: string };
  /** Whose project: the org (team) or a member (personal). */
  ownerType?: 'team' | 'personal';
  ownerLabel?: string;
}

export interface ProjectFilter {
  q?: string;
  category?: string;
  tag?: string;
  tech?: string;
  featured?: boolean;
}

/** Filter a project list (the DB-backed list rendered on /projects). */
export function filterProjectList(list: Project[], filter: ProjectFilter): Project[] {
  const q = filter.q?.trim().toLowerCase();
  const tech = filter.tech?.trim().toLowerCase();
  return list.filter((p) => {
    if (filter.featured && !p.isFeatured) return false;
    if (filter.category && p.category !== filter.category) return false;
    if (filter.tag && !p.tags.includes(filter.tag)) return false;
    if (tech && !p.technologies.some((t) => t.toLowerCase() === tech)) return false;
    if (q) {
      const haystack = `${p.title} ${p.titleEn} ${p.description}`.toLowerCase();
      if (!haystack.includes(q)) return false;
    }
    return true;
  });
}

const uniqSorted = (xs: string[]) => Array.from(new Set(xs)).sort();

/** Facets derived from a project list (categories/technologies/tags for the filters). */
export function facetsFor(list: Project[]) {
  return {
    categories: uniqSorted(list.map((p) => p.category).filter(Boolean)),
    technologies: uniqSorted(list.flatMap((p) => p.technologies)),
    tags: uniqSorted(list.flatMap((p) => p.tags)),
  };
}
