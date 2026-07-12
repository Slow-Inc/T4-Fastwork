/**
 * Featured projects for the homepage gallery. MangaDock is the real flagship
 * (matches the backend seed); the rest are curated T4 Labs work. The full
 * filterable list lives on /projects (backed by the API) — a later effort.
 */
export interface FeaturedProject {
  slug: string;
  name: string;
  caption: string;
  tag: string;
  tone: 'ink' | 'sand' | 'teal' | 'gray';
  size: 'a' | 'b' | 'c' | 'd';
}

export const featuredProjects: FeaturedProject[] = [
  { slug: 'mangadock', name: 'MangaDock', caption: 'MangaDock — AI manga translation', tag: 'AI · OCR', tone: 'teal', size: 'a' },
  { slug: 'listingthai', name: 'ListingThai', caption: 'ListingThai — property marketplace', tag: 'Next.js', tone: 'ink', size: 'b' },
  { slug: 'powernics', name: 'Powernics', caption: 'Powernics — solar platform', tag: 'React', tone: 'gray', size: 'c' },
  { slug: 'ghost-maps', name: 'The Ghost Maps', caption: 'The Ghost Maps — realtime places', tag: 'Supabase', tone: 'sand', size: 'd' },
];
