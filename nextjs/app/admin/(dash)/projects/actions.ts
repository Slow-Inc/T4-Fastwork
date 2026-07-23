'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/server';
import { assertAdmin } from '@/lib/admin-access';
import {
  memberRepoToProjectInsert,
  availableToImport,
  type MemberRepoInput,
} from '@/lib/member-repo-import';
import {
  orgRepoToProjectInsert,
  resolveOrgRepoFromSnapshot,
  parseOrgReposFromTeamPayload,
  orgReposToBulkInserts,
  SLOW_INC_ORG,
  type ExistingProjectIdentity,
} from '@/lib/org-repo-import';
import { getTeamSnapshotPayload } from '@/lib/github';

export interface ProjectFormState {
  error?: string;
}

function slugify(input: string): string {
  return input
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9ก-๙\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
}

export async function createProject(
  _prev: ProjectFormState,
  formData: FormData,
): Promise<ProjectFormState> {
  await assertAdmin();
  const title = formData.get('title')?.toString().trim() ?? '';
  const slug = (formData.get('slug')?.toString().trim() || slugify(title)) ?? '';
  if (!title || !slug) return { error: 'ต้องมีชื่อและ slug' };

  const published = formData.get('published') === 'on';
  const supabase = await createClient();
  const { error } = await supabase.from('projects').insert({
    slug,
    title,
    title_en: formData.get('title_en')?.toString() || null,
    description: formData.get('description')?.toString() || null,
    content: formData.get('content')?.toString() || null,
    live_url: formData.get('live_url')?.toString() || null,
    snapshot_image: formData.get('snapshot_image')?.toString() || null,
    is_featured: formData.get('is_featured') === 'on',
    published_at: published ? new Date().toISOString() : null,
  });

  if (error) {
    return { error: error.message.includes('duplicate') ? 'slug นี้มีอยู่แล้ว' : 'บันทึกไม่สำเร็จ' };
  }

  revalidatePath('/admin/projects');
  revalidatePath('/projects');
  redirect('/admin/projects');
}

export async function updateProject(
  _prev: ProjectFormState,
  formData: FormData,
): Promise<ProjectFormState> {
  await assertAdmin();
  const id = Number(formData.get('id'));
  const title = formData.get('title')?.toString().trim() ?? '';
  if (!id || !title) return { error: 'ข้อมูลไม่ครบ' };

  const published = formData.get('published') === 'on';
  const supabase = await createClient();
  const { error } = await supabase
    .from('projects')
    .update({
      title,
      title_en: formData.get('title_en')?.toString() || null,
      description: formData.get('description')?.toString() || null,
      content: formData.get('content')?.toString() || null,
      live_url: formData.get('live_url')?.toString() || null,
      snapshot_image: formData.get('snapshot_image')?.toString() || null,
      is_featured: formData.get('is_featured') === 'on',
      published_at: published ? new Date().toISOString() : null,
    })
    .eq('id', id);

  if (error) return { error: 'บันทึกไม่สำเร็จ' };

  revalidatePath('/admin/projects');
  revalidatePath('/projects');
  redirect('/admin/projects');
}

/** A member_projects row + its member's github_login (for the import mapping). */
interface MemberRepoRow {
  id: number;
  name: string;
  url: string;
  description: string | null;
  members: { github_login: string | null } | { github_login: string | null }[] | null;
}

function toInput(r: MemberRepoRow): MemberRepoInput {
  const m = Array.isArray(r.members) ? r.members[0] : r.members;
  return {
    name: r.name,
    url: r.url,
    description: r.description,
    ownerLogin: m?.github_login ?? null,
  };
}

const MEMBER_REPO_SELECT =
  'id, name, url, description, members!inner(github_login)';

/** Promote one member-selected repo to a projects row (idempotent by slug). */
export async function importMemberRepo(formData: FormData) {
  await assertAdmin();
  const id = Number(formData.get('id'));
  if (!id) return;
  const supabase = await createClient();
  const { data } = await supabase
    .from('member_projects')
    .select(MEMBER_REPO_SELECT)
    .eq('id', id)
    .maybeSingle();
  if (!data) return;
  const row = memberRepoToProjectInsert(
    toInput(data as unknown as MemberRepoRow),
    new Date().toISOString(),
  );
  await supabase
    .from('projects')
    .upsert(row, { onConflict: 'slug', ignoreDuplicates: true });
  revalidatePath('/admin/projects');
  revalidatePath('/projects');
  redirect('/admin/projects');
}

/** Bulk-import every selected member repo not already in `projects`. */
export async function importAllMemberRepos() {
  await assertAdmin();
  const supabase = await createClient();
  const [repos, existing] = await Promise.all([
    supabase
      .from('member_projects')
      .select(MEMBER_REPO_SELECT)
      .eq('selected', true),
    supabase.from('projects').select('slug'),
  ]);
  const inputs = ((repos.data as unknown as MemberRepoRow[]) ?? []).map(toInput);
  const existingSlugs = ((existing.data as { slug: string }[]) ?? []).map(
    (p) => p.slug,
  );
  const now = new Date().toISOString();
  const rows = availableToImport(inputs, existingSlugs).map((mp) =>
    memberRepoToProjectInsert(mp, now),
  );
  if (rows.length) {
    await supabase
      .from('projects')
      .upsert(rows, { onConflict: 'slug', ignoreDuplicates: true });
  }
  revalidatePath('/admin/projects');
  revalidatePath('/projects');
  redirect('/admin/projects');
}

/**
 * Promote one Slow-Inc org repo from the durable team snapshot into `projects`.
 * Form fields are untrusted — the action re-resolves owner/repo against the
 * snapshot and fail-closes when the identity is missing or forged.
 */
export async function importOrgRepo(formData: FormData) {
  await assertAdmin();
  const owner = formData.get('owner')?.toString().trim() ?? '';
  const repo = formData.get('repo')?.toString().trim() ?? '';
  if (!owner || !repo) return;

  const team = await getTeamSnapshotPayload();
  const orgData =
    team && typeof team === 'object'
      ? (team as { org?: { data?: unknown } | null }).org?.data
      : null;
  const resolved = resolveOrgRepoFromSnapshot(
    orgData,
    owner,
    repo,
    SLOW_INC_ORG,
  );
  if (!resolved) return;

  const row = orgRepoToProjectInsert(
    resolved,
    new Date().toISOString(),
    SLOW_INC_ORG,
  );
  const supabase = await createClient();
  await supabase
    .from('projects')
    .upsert(row, { onConflict: 'slug', ignoreDuplicates: true });
  revalidatePath('/admin/projects');
  revalidatePath('/projects');
  redirect('/admin/projects');
}

/**
 * Bulk-import every Slow-Inc org repo from the durable snapshot that is not yet
 * represented. Recomputes the missing set server-side (never trusts a client
 * checklist). Empty missing set / missing snapshot → no-op.
 */
export async function importAllOrgRepos() {
  await assertAdmin();
  const team = await getTeamSnapshotPayload();
  const catalogue = parseOrgReposFromTeamPayload(team, SLOW_INC_ORG);
  if (!catalogue) return;

  const supabase = await createClient();
  const { data: existing } = await supabase
    .from('projects')
    .select('slug, gh_owner, gh_repo');
  const identities: ExistingProjectIdentity[] = (
    (existing as
      | { slug: string; gh_owner: string | null; gh_repo: string | null }[]
      | null) ?? []
  ).map((p) => ({
    slug: p.slug,
    ghOwner: p.gh_owner,
    ghRepo: p.gh_repo,
  }));
  const rows = orgReposToBulkInserts(
    catalogue,
    identities,
    new Date().toISOString(),
    SLOW_INC_ORG,
  );
  if (rows.length) {
    await supabase
      .from('projects')
      .upsert(rows, { onConflict: 'slug', ignoreDuplicates: true });
  }
  revalidatePath('/admin/projects');
  revalidatePath('/projects');
  redirect('/admin/projects');
}

export async function deleteProject(formData: FormData) {
  await assertAdmin();
  const id = formData.get('id')?.toString();
  if (!id) return;
  const supabase = await createClient();
  await supabase.from('projects').delete().eq('id', Number(id));
  revalidatePath('/admin/projects');
  revalidatePath('/projects');
}
