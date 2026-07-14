# Vercel CLI — ops cheat-sheet

How this repo drives Vercel from the command line (env vars, deploys, redeploys)
and the read-only Vercel MCP tools. Both apps are already `vercel link`-ed —
`nextjs/.vercel/project.json` and `nestjs/.vercel/project.json` hold the
`projectId` + `orgId` (team). Run env/deploy commands **from the app's own
directory** so the CLI targets the right project.

Projects (team `t4labs` / `team_6SGJBocKVqgVD6AIW1IcGSnQ`):
- frontend `t4-fastwork-nextjs` → https://t4-fastwork-nextjs.vercel.app
- backend  `t4-fastwork-nestjs` → https://t4-fastwork-nestjs.vercel.app

## Running the CLI on this machine

`vercel` isn't installed globally — run it with Bun's `bunx`. **Bun is only on
PATH in PowerShell**, not the Git-Bash tool, so:

```powershell
# PowerShell (Bun is on PATH here)
bunx vercel@latest whoami          # confirm auth (expect: xenodeve)
```

```bash
# Git Bash — add Bun to PATH first, and use `bun x`
export PATH="/c/Users/xenod/.bun/bin:$PATH"
bun x vercel@latest whoami
```

Auth is already stored from a prior `vercel login`; if it ever expires, run
`bunx vercel@latest login`. For non-interactive/CI use, pass `--token $VERCEL_TOKEN`.

## Environment variables

```powershell
cd nextjs                                   # target the frontend project
bunx vercel@latest env ls production        # list keys (values shown Encrypted)
bunx vercel@latest env pull .env.local      # download into a local file
bunx vercel@latest env rm NAME production    # remove
```

**Adding a secret without leaking it** — read the value into a variable and pipe
it to `env add` over stdin; never echo it. Strip any trailing newline/CR (Windows
`.env` files are CRLF — a stray `\r` silently corrupts the stored secret):

```bash
export PATH="/c/Users/xenod/.bun/bin:$PATH"
cd nextjs
val=$(grep '^GITHUB_REFRESH_SECRET=' ../nestjs/.env | head -1 \
      | sed 's/^GITHUB_REFRESH_SECRET=//' | tr -d '\r\n')
val="${val%\"}"; val="${val#\"}"            # strip optional surrounding quotes
printf '%s' "$val" | bun x vercel@latest env add GITHUB_REFRESH_SECRET production
```

`printf '%s'` (no newline) matters — a piped newline would become part of the
secret. Confirm with `env ls`; the value is stored `Sensitive` (write-only).

> **A new/changed env var only takes effect on the NEXT deploy** — redeploy after
> adding one to an already-live deployment (see below).

## Deploy / redeploy

Git integration auto-deploys every push (and production on merge to `master`), so
you rarely deploy by hand. When you change an env var and need the running
production to pick it up, **redeploy the current production deployment** — this
rebuilds with the latest project settings (incl. env vars):

```powershell
cd nextjs
bunx vercel@latest ls                         # find the current prod deployment URL
bunx vercel@latest redeploy <deployment-url>  # rebuild + re-alias to the prod domain
```

`vercel deploy --prod` also works but deploys your **local working dir**, not
`master` — prefer `redeploy` (or a git push) to stay in sync with the branch.

## Read-only inspection via Vercel MCP

For status/logs, prefer the MCP tools (no CLI round-trip). They need the
`projectId` + `teamId` from `.vercel/project.json`:

- `list_projects(teamId)` · `get_project` — discover projects/IDs
- `list_deployments(projectId, teamId)` — latest deploys, `state`, the git commit each built
- `get_deployment(idOrUrl, teamId)` · `get_deployment_build_logs` · `get_runtime_logs` · `get_runtime_errors`
- `deploy_to_vercel` — trigger a deploy

## #25 activation (what was actually run)

1. `env add GITHUB_REFRESH_SECRET production` on `t4-fastwork-nextjs` (value = the
   backend's `GITHUB_REFRESH_SECRET`, so the R4 heal-on-read POST authenticates).
2. `redeploy` the production deployment so it picks up the new secret.

Still external (not CLI-doable here): the repo Actions secret `BACKEND_REFRESH_SECRET`
(via `gh secret set`, value = same secret — GitHub reserves the `GITHUB_` prefix
for Actions secrets) and the `Slow-Inc` org webhook. See
`docs/deploy/realtime-freshness-runbook.md`.

## Gotchas

- **Wrong project?** You ran from the wrong dir. `cd nextjs` / `cd nestjs` first —
  the CLI resolves the project from `.vercel/` in the current directory.
- **`bunx: command not found`** in the Bash tool — Bun isn't on that shell's PATH;
  use PowerShell or `export PATH="/c/Users/xenod/.bun/bin:$PATH"` + `bun x`.
- **Secret has a trailing newline** — you piped with `echo` instead of
  `printf '%s'`, or didn't strip CRLF. The auth then fails the constant-time check.
- **Env change didn't apply** — env vars bind at deploy time; redeploy.
