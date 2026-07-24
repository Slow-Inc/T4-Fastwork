'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/server';
import { assertAdmin } from '@/lib/admin-access';
import {
  applyMemberProjectSelectionToggle,
  planHistoricalShowcaseUnpublish,
  type MemberShowcaseSyncStore,
  type ShowcaseProjectCandidate,
} from '@/lib/member-showcase-sync';

function mapProjectRow(r: Record<string, unknown>): ShowcaseProjectCandidate {
  return {
    id: Number(r.id),
    status: String(r.status),
    source: String(r.source ?? ''),
    ownerType: r.owner_type == null ? null : String(r.owner_type),
    ownerLogin: r.owner_login == null ? null : String(r.owner_login),
    ghOwner: r.gh_owner == null ? null : String(r.gh_owner),
    ghRepo: r.gh_repo == null ? null : String(r.gh_repo),
    ghHtmlUrl: r.gh_html_url == null ? null : String(r.gh_html_url),
  };
}

async function supabaseShowcaseStore(): Promise<MemberShowcaseSyncStore> {
  const supabase = await createClient();
  return {
    async getMemberProject(id) {
      const { data, error } = await supabase
        .from('member_projects')
        .select('id, url, member_id')
        .eq('id', id)
        .maybeSingle();
      if (error || !data) return null;
      return {
        id: Number(data.id),
        url: String(data.url),
        memberId: Number(data.member_id),
      };
    },
    async getMemberGithubLogin(memberId) {
      const { data, error } = await supabase
        .from('members')
        .select('github_login')
        .eq('id', memberId)
        .maybeSingle();
      if (error || !data?.github_login) return null;
      return String(data.github_login);
    },
    async listPersonalGithubProjects() {
      const { data, error } = await supabase
        .from('projects')
        .select(
          'id, status, source, owner_type, owner_login, gh_owner, gh_repo, gh_html_url',
        )
        .eq('source', 'github')
        .eq('owner_type', 'personal');
      if (error || !data) return [];
      return data.map((r) => mapProjectRow(r as Record<string, unknown>));
    },
    async setMemberProjectSelected(id, selected) {
      const { error } = await supabase
        .from('member_projects')
        .update({ selected })
        .eq('id', id);
      if (error) throw new Error(error.message);
    },
    async setProjectStatus(id, status) {
      const patch: { status: string; published_at?: string | null } = {
        status,
      };
      if (status === 'published') {
        patch.published_at = new Date().toISOString();
      }
      const { error } = await supabase
        .from('projects')
        .update(patch)
        .eq('id', id)
        .eq('owner_type', 'personal');
      if (error) throw new Error(error.message);
    },
  };
}

/** Admin toggle: profile selection ↔ personal ผลงาน publish state (#180). */
export async function toggleMemberProjectSelection(
  memberProjectId: number,
  selected: boolean,
): Promise<{ ok: true } | { ok: false; error: string }> {
  await assertAdmin();
  try {
    const store = await supabaseShowcaseStore();
    const res = await applyMemberProjectSelectionToggle({
      memberProjectId,
      selected,
      store,
      revalidate: () => {
        revalidatePath('/projects');
        revalidatePath('/admin/projects');
        revalidatePath('/admin/members');
      },
    });
    if (!res.ok) return res;
    return { ok: true };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : 'sync failed',
    };
  }
}

/** Dry-run or apply historical drift repair (#182). */
export async function reconcileDeselectedPersonalShowcase(opts?: {
  apply?: boolean;
}): Promise<
  | { ok: true; planned: number; applied: boolean; projectIds: number[] }
  | { ok: false; error: string }
> {
  await assertAdmin();
  const apply = opts?.apply === true;
  try {
    const supabase = await createClient();
    const [{ data: mps, error: mpErr }, { data: projects, error: pErr }] =
      await Promise.all([
        supabase
          .from('member_projects')
          .select('url, selected, members!inner(github_login)'),
        supabase
          .from('projects')
          .select(
            'id, status, source, owner_type, owner_login, gh_owner, gh_repo, gh_html_url',
          )
          .eq('source', 'github'),
      ]);
    if (mpErr) return { ok: false, error: mpErr.message };
    if (pErr) return { ok: false, error: pErr.message };

    const memberRepos = (mps ?? []).map((r) => {
      const members = r.members as
        | { github_login: string | null }
        | { github_login: string | null }[]
        | null;
      const login = Array.isArray(members)
        ? members[0]?.github_login
        : members?.github_login;
      return {
        url: String(r.url),
        selected: Boolean(r.selected),
        memberGithubLogin: login ? String(login) : '',
      };
    }).filter((r) => r.memberGithubLogin);

    const planned = planHistoricalShowcaseUnpublish({
      memberRepos,
      projects: (projects ?? []).map((r) =>
        mapProjectRow(r as Record<string, unknown>),
      ),
    });
    const projectIds = planned.map((p) => p.projectId);
    if (apply && projectIds.length > 0) {
      const { error } = await supabase
        .from('projects')
        .update({ status: 'hidden' })
        .in('id', projectIds)
        .eq('owner_type', 'personal');
      if (error) return { ok: false, error: error.message };
      revalidatePath('/projects');
      revalidatePath('/admin/projects');
    }
    return {
      ok: true,
      planned: projectIds.length,
      applied: apply,
      projectIds,
    };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : 'reconcile failed',
    };
  }
}
