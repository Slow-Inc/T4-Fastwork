import 'server-only';
import { publicDb } from '@/lib/public-db';
import { EXPERIENCE_SINCE_YEAR, experienceYears } from '@/content/site';

export interface SiteStats {
  years: number;
  projects: number;
  certs: number;
}

const FALLBACK: Omit<SiteStats, 'years'> = { projects: 21, certs: 9 };

/**
 * Live headline stats for the hero metric band (B-vision "dynamic, not hardcoded"):
 *  - years   = current year − EXPERIENCE_SINCE_YEAR (increments yearly).
 *  - projects = every member project + team collaborative project actually built.
 *  - certs    = distinct real certificates the team holds (member_certificates,
 *               published, deduped by issuer|title to match what /about shows).
 * DB-first with a static fallback so the hero never breaks.
 */
export async function getSiteStats(): Promise<SiteStats> {
  const years = experienceYears(EXPERIENCE_SINCE_YEAR, new Date().getFullYear());
  try {
    const supabase = publicDb();
    const [mp, tp, mc] = await Promise.all([
      supabase.from('member_projects').select('id', { count: 'exact', head: true }),
      supabase.from('team_projects').select('id', { count: 'exact', head: true }),
      supabase.from('member_certificates').select('issuer, title').eq('status', 'published'),
    ]);
    const projects = (mp.count ?? 0) + (tp.count ?? 0);
    const certRows = (mc.data ?? []) as { issuer: string; title: string }[];
    const certs = new Set(
      certRows.map((c) => `${c.issuer}|${c.title}`.toLowerCase()),
    ).size;
    // A total wipe-out means the DB is unreachable — keep the fallback numbers.
    if (projects === 0 && certs === 0) return { years, ...FALLBACK };
    return { years, projects: projects || FALLBACK.projects, certs: certs || FALLBACK.certs };
  } catch {
    return { years, ...FALLBACK };
  }
}
