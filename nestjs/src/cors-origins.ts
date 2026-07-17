/**
 * Parse the CORS allow-list from `FRONTEND_ORIGIN`. Supports a comma-separated
 * list so the API can be called from more than one frontend origin — e.g. the
 * custom domain `t4labs.dev`, the legacy `t4labs.co` during a domain migration,
 * and the raw Vercel deployment URL. Falls back to the local dev origin when
 * unset/blank. Only the explicit configured origins are allowed (never a
 * wildcard), so this stays a safe CORS control.
 */
export function parseAllowedOrigins(env: string | undefined): string[] {
  const list = (env ?? '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
  return list.length > 0 ? list : ['http://localhost:3000'];
}
