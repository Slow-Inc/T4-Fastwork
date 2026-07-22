# Serena MCP — environment & "do not break it" guide (Codex + Claude)

**Audience:** any agent (Codex, Claude Code) or human working on this machine that uses the
shared **Serena** MCP server. This is *environment/tooling* guidance, not repo code — the paths
are for this Windows dev box (`C:\Users\xenod`).

**Why this exists:** on 2026-07-16 a session of MCP setup left the shared Serena install with
**10 runtime dependencies missing** (`mcp`, `bs4`, `sensai-utils`, `requests`, `flask`,
`anthropic`, `pywebview`, `pyyaml`, `ruamel-yaml`, `types-pyyaml`). Result: `serena` crashed at
import *before it could log*, so every client got `Failed to reconnect to serena: -32000` with
**no Serena log** to explain it. Root cause was a **gutted tool venv**, not a client conflict.

---

## How Serena is installed here (know this before touching it)

- Installed as a **uv tool** from git: `git+https://github.com/oraios/serena` (dev build
  `1.5.4.dev0`). See the receipt: `%APPDATA%\uv\tools\serena-agent\uv-receipt.toml`.
- Tool venv (the real code + deps): `C:\Users\xenod\AppData\Roaming\uv\tools\serena-agent\`
- Launcher shims on PATH (`~/.local/bin`, must stay on PATH): `serena`, `serena-agent`,
  `serena-hooks`. Claude/Codex launch the MCP server via the bare command **`serena`**, so if
  `serena` is broken, the MCP connection dies with `-32000`.
- A **second, separate** Serena env exists in the uvx cache
  (`AppData\Local\uv\cache\archive-v0\...`). A working `uvx serena ...` can run from there even
  when the tool venv is broken — which is why "it works in one place but not another" is
  misleading. **Claude's config uses the tool-venv `serena`, so that one must be healthy.**
- Global, **shared** config: `C:\Users\xenod\.serena\serena_config.yml` + logs under
  `~/.serena/logs/<date>/`. Both Codex and Claude read/write this same config.

## ❌ Do NOT do these (they broke it)

1. **Do NOT run `uv pip install` / `uv pip sync` against the Serena tool venv**
   (`...\uv\tools\serena-agent\...\python.exe`). It can desync/prune the tool's dependency set.
   Repairing deps piecemeal (`uv pip install click`) is a band-aid that leaves others missing.
2. **Do NOT `uv cache clean` / prune uv caches** while relying on Serena — it can remove the
   env the working server runs from.
3. **Do NOT hand-edit `~/.claude.json` `mcpServers.serena.args`** to hardcode another repo
   (it was left pointing at `D:\Github\MangaDock`). Claude/Codex override `--project` with the
   current workspace, so hardcoding just causes confusion — leave it or point it at the repo
   you're in.
4. **Do NOT assume "two clients collide."** Serena supports concurrent clients (dashboard port
   falls back 24282 → 24283 → …). Running Codex + Claude at once is fine; that was **not** the
   bug.

## ✅ If Serena fails — diagnose, then repair correctly

**Diagnose (fast, deterministic):**
```bash
serena --version                      # crashes with ModuleNotFoundError => venv is broken
# The exact command the clients run — must reach "Starting MCP server with N tools":
serena start-mcp-server --context ide-assistant --project "D:/Github/T4 Fastwork" < /dev/null
```
`-32000` **with no new file** under `~/.serena/logs/<date>/` == Serena crashed at import (broken
venv). `-32000` **with** a full healthy log == a client-side/transport issue, look elsewhere.

**Repair (the only correct fix — restores the whole dep tree + rebuilds shims):**
```bash
uv tool install --reinstall "git+https://github.com/oraios/serena"
```
Then re-verify with the two commands above, and reconnect (`/mcp` in Claude, restart in Codex).

## Notes / gotchas

- `serena-hooks` (the `~/.claude/settings.json` hooks: `activate` / `remind` / `auto-approve`
  / `cleanup`) is a **separate entry point in the same venv** — a broken venv breaks it too. It
  reads a JSON event on **stdin**; running it with no stdin throws `JSONDecodeError` — that is
  expected, not a defect.
- Serena servers are stdio; each client spawns its own and it stays idle after answering
  `ListToolsRequest` (that log line is the healthy resting state, not a crash).
- If you must clear stale/orphaned servers, kill the `python … serena … start-mcp-server`
  processes, then reconnect a single client — don't `uv pip`/`cache clean` to "fix" it.
