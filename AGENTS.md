# Agent Instructions

The canonical repository instructions are in [CLAUDE.md](./CLAUDE.md). **At the start of every
repository task, read it in full before analysis or changes** — it is the source of truth for
workflow, architecture, commands, testing, security, documentation, and the shared knowledge
bootstrap. Direct user instructions always take precedence.

The rules below are Codex/autonomous-agent safety supplements to `CLAUDE.md`. When an overlap is
more restrictive here, follow the stricter rule; do not treat this file as a competing workflow.

Repository skills are canonical under `.agents/skills/`. Files under `.claude/skills/` are
discovery wrappers that point to the canonical copy; do not duplicate skill bodies there.

---

# Operating rules for autonomous agents (Codex in particular)

These rules are **mandatory** and exist because prior autonomous actions in this environment
**broke shared tooling** — a session gutted the Serena MCP tool venv (10 missing deps →
`-32000` for every client) and left the pal MCP misconfigured (no `env` → "connection closed").
The rules keep changes **small, verified, and reversible**. If you are an agent whose planning
or self-verification is less reliable, follow these to the letter rather than improvising.

## 1. Stay strictly in scope

- Do **only** what the user asked. Do not set up, reconfigure, "improve", or "clean up"
  anything that was not requested — **especially** MCP servers, global configs, environment
  variables, PATH, package installs, or tooling.
- If the task appears to require touching something **outside this repository** (machine
  config, global installs, another repo), **STOP and ask first**. Do not proceed on assumption.
- "The user asked X" means do X — not "also reorganize/upgrade/migrate adjacent things."

## 2. Never mutate shared machine-level tooling without an explicit instruction

Off-limits unless the user **explicitly** asks you to change them, and even then, back up first:

- uv **tool** venvs: `%APPDATA%\uv\tools\*` (e.g. `serena-agent`, `pal-mcp-server`)
- `~/.serena/*`, `~/.claude.json`, `~/.codex/config.toml`, `~/.claude/settings.json`
- installed MCP servers, PATH entries, environment variables, the uv cache

Hard prohibitions (these are what caused the breakage):

- **NEVER** `uv pip install` / `uv pip sync` into a uv **tool** venv. It desyncs/prunes the
  tool's dependency set. To repair a uv tool, the **only** correct command is
  `uv tool install --reinstall <source>` (for Serena: the git source — see
  [`docs/serena-mcp-environment.md`](./docs/serena-mcp-environment.md)).
- **NEVER** `uv cache clean` while any MCP tool may be running.
- **NEVER** hardcode a wrong project/path into a shared MCP config (e.g. pointing Serena at a
  different repo). Clients pass the current workspace as `--project`; leave it be.
- **Always** back up a config before editing it: `cp file file.bak`.

## 3. Verify every change end-to-end — never assume

This is the single most important rule; the breakage above came from changes made without
verification.

- After a change, **prove it works** by running the real command / actual flow and **reading
  the output**. "It should work" is not acceptable.
- After touching an MCP server: confirm it **actually connects** and that a **tool call
  succeeds** — do not declare success from a config edit alone. If it fails, **read the
  server's log** (`~/.serena/logs/...`, pal's `logs/mcp_server.log`), find the fail path, and
  fix the root cause. Do **not** retry blindly or reinstall at random.
- **Never leave a tool, config, or build in a broken or half-configured state.** If you cannot
  finish, restore the backup and report exactly what is broken and why.

## 4. When something breaks, diagnose — do not thrash

Reproduce → read the logs → trace the fail path → form a hypothesis → try to **disprove** it →
then fix. One deliberate experiment beats ten hopeful retries. Do not spam reconnects, random
reinstalls, or speculative config edits hoping one sticks.

## 5. Secrets & config values

- Do not invent or guess config values. If a working reference exists (another client's
  config), copy the **exact** values; if none exists, **ask** — do not half-configure.
- Do not print secrets (API keys/tokens) in output or commit messages. When copying an env
  block, **redact** key values in anything you display.
- Config files that hold secrets (`~/.claude.json`, `~/.codex/config.toml`) are local and
  git-ignored — never move their contents into the repo or a commit.

## 6. Small, reversible steps

- One change at a time; verify; then the next. No large multi-file config rewrites in a single
  shot.
- Prefer the least-invasive fix that solves the problem. Reversibility beats cleverness.
- Do not run destructive or global commands casually: `git push --force`, `git reset --hard`,
  mass `kill`/`taskkill`, `rm -rf`, registry edits, global env changes.

## 7. Follow the repository standards (same as every agent)

Per [CLAUDE.md](./CLAUDE.md), non-negotiable:

- **TDD is mandatory**; write the failing test first.
- **Verify every frontend change with `bun run e2e`** — unit tests cannot see real
  layout/hydration.
- **Bun** is the package manager — use `bunx`, commit `bun.lock`, never `package-lock.json`.
- **Bilingual (Thai + English)** is required **only** for GitHub issue/PR bodies; code, commits,
  and repo docs stay English.
- Write an **ADR** (`docs/adr/`) for any hard-to-reverse decision; never edit an ADR to reverse
  it.
- Read the relevant ADR and the **vendored Next.js docs** (`nextjs/node_modules/next/dist/docs/`)
  before touching those areas — the pinned Next version is newer than your training data.
- Use the `security-review` skill on any auth / RLS / admin-write / security-sensitive change.

## MCP tooling on this machine (reference)

- **Serena** and **pal** are both installed as **uv tools** (venvs under `%APPDATA%\uv\tools\`),
  with launcher shims on PATH (`~/.local/bin`). A broken venv makes the bare command crash at
  import → the client reports a startup/`-32000` error with **no useful log from the server**.
- Serena repair + full environment map: **[`docs/serena-mcp-environment.md`](./docs/serena-mcp-environment.md)**.
- pal needs its provider `env` (`CUSTOM_API_*`) in the launching client's MCP config, or it
  exits at startup ("connection closed: initialize response"). Copy the exact env from a working
  client's config; do not guess.
- Multiple clients (Codex + Claude) using the same MCP servers concurrently is **fine** — the
  servers handle it (dashboard port fallback). Concurrency is **not** a cause of failure; a
  broken install or missing env is.
