/**
 * Dispatch the screenshot-projects GitHub Action for one slug (#190).
 * Uses the Actions workflow_dispatch API. No-ops when token/repo unset (dev).
 */
export interface ScreenshotDispatchOpts {
  slug: string;
  force?: boolean;
  trigger?: string;
  fetchImpl?: typeof fetch;
}

export async function dispatchScreenshotWorkflow(
  opts: ScreenshotDispatchOpts,
): Promise<{ dispatched: boolean; reason?: string }> {
  const token =
    process.env.SCREENSHOT_DISPATCH_TOKEN ||
    process.env.GITHUB_TOKEN ||
    process.env.GH_TOKEN;
  const repo =
    process.env.SCREENSHOT_WORKFLOW_REPO ||
    process.env.GITHUB_REPOSITORY ||
    'Slow-Inc/T4-Fastwork';
  const ref = process.env.SCREENSHOT_WORKFLOW_REF || 'master';
  const workflow =
    process.env.SCREENSHOT_WORKFLOW_FILE || 'screenshot-projects.yml';

  if (!token) {
    return { dispatched: false, reason: 'no-token' };
  }

  const fetchImpl = opts.fetchImpl ?? globalThis.fetch;
  const url = `https://api.github.com/repos/${repo}/actions/workflows/${workflow}/dispatches`;
  const res = await fetchImpl(url, {
    method: 'POST',
    // This call runs inside the pipeline's advisory-lock transaction on the Supavisor
    // transaction pooler, so a stalled socket would hold a pooler connection open
    // indefinitely. Bound it (#199).
    signal: AbortSignal.timeout(10_000),
    headers: {
      Accept: 'application/vnd.github+json',
      Authorization: `Bearer ${token}`,
      'X-GitHub-Api-Version': '2022-11-28',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      ref,
      inputs: {
        slug: opts.slug,
        force: opts.force ? 'true' : 'false',
        ...(opts.trigger ? { trigger: opts.trigger } : {}),
      },
    }),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    return {
      dispatched: false,
      reason: `http-${res.status}:${text.slice(0, 200)}`,
    };
  }
  return { dispatched: true };
}
