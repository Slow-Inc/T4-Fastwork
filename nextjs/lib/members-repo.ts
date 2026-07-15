import 'server-only';
import { publicDb } from '@/lib/public-db';
import { team, deriveTeamTechnologies } from '@/content/site';

/**
 * Team tech union from the `members` DB table (`members.stack`) — the home tech
 * carousel's source (#44). DB-first with the static `team` as fallback (matches
 * the projects/blog repos). Once members become self-editable (Epic C), the
 * carousel reflects their edits with no component change.
 */
export async function getTeamTechnologies(): Promise<string[]> {
  const fallback = deriveTeamTechnologies(team);
  try {
    const supabase = publicDb();
    const { data, error } = await supabase.from('members').select('stack');
    if (error || !data || data.length === 0) return fallback;
    return deriveTeamTechnologies(
      (data as { stack: string[] | null }[]).map((r) => ({
        stack: r.stack ?? [],
      })),
    );
  } catch {
    return fallback;
  }
}
