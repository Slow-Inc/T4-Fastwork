# Subagent delegation log (2026-07-16 AFK batch)

Empirical notes on delegating menial work to cheap subagents during the clear-backlog
AFK run, so the team can tune the setup. Tools under test: **qwen** (`claude-9arm`,
qwen3.6-35b-a3b via 9arm gateway) and **clink** (`mcp__pal__clink` → codex GPT-5.6 /
antigravity Gemini 3.x). Discipline: every delegated output is verified by me before use.

Columns: task · agent · mode · wall-clock · followed constraints? · correct? · verify result · verdict.

## Runs

_(appended as each delegation completes)_

| # | Task | Agent | Mode | Wall-clock | Constraints | Correct | Verify | Verdict |
|---|---|---|---|---|---|---|---|---|
| 1 | E1+E2 nestjs cleanup | qwen (`claude-9arm`) | headless `-p` + `--allowedTools Bash Read Edit Write Glob Grep` | n/a | n/a | n/a | **BLOCKED** | ⛔ blocked by Claude Code auto-mode classifier before launch |
| 2 | code-review the 5-commit backlog batch (`62b7777..HEAD`) | clink → codex (GPT-5.6) | MCP `mcp__pal__clink`, role `codereviewer`, `--dangerously-bypass-approvals-and-sandbox` | **354 s** | ✅ read-only as asked (no edits) | ✅ high — findings verified true | ✅ ran its own `git diff` + lint + targeted `bun test` | ⭐ excellent — 1 real Medium + 2 valid Low, all confirmed & fixed |

## Per-run detail

### Run 1 — qwen, E1+E2 (BLOCKED, not executed)
- **What:** delegate two surgical nestjs edits (remove dead `StubRetrievalService`; fix a stale `DatabaseModule` comment).
- **Outcome:** the harness **auto-mode classifier denied the Bash launch** of `claude-9arm -p ... --allowedTools Bash Read Edit Write Glob Grep`. Reason given: launching a third-party coding-agent binary in headless mode with shell+file-write and **no per-action approval gate**, which the user's "try qwen-agent" instruction named but did not explicitly authorize (the dropped approval/sandbox).
- **Fix needed to use qwen unattended:** the user must add a Bash allow rule, e.g. `"permissions": { "allow": ["Bash(claude-9arm:*)"] }` (the qwen-agent skill's "one-time setup"), OR approve the launch interactively. Narrowing `--allowedTools` to drop `Bash` (edit-only: `Read Edit Write Glob Grep`) *might* clear it but was not retried to avoid repeated denials during AFK.
- **Action taken:** parked the qwen experiment; did E1+E2 myself (trivial). qwen remains untested this run — pending the permission rule above.

### Run 2 — clink → codex, code-review the backlog batch (SUCCESS)
- **What:** `mcp__pal__clink` (`cli_name: codex`, `role: codereviewer`) to adversarially review the 5 commits `62b7777..HEAD` — asked it to run its own `git diff` and assess the C2 lint downgrade, C4 hermetic test, E1 dead-code removal, C3 extraction, C5 e2e changes.
- **Mechanics:** clink is a first-class MCP tool (NOT a Bash-launched binary), so it was **not** blocked by the classifier that stopped qwen. codex ran with `--dangerously-bypass-approvals-and-sandbox` internally but only read (as instructed). Took **354 s**; consumed ~1.08M input tokens (mostly cached) / 5.5k output.
- **Return-contract gotcha:** the result was **91,583 chars on one line** → exceeded the tool-result token cap and was spilled to a file (`…/tool-results/mcp-pal-clink-*.txt`) whose lines are too long for Read's offset/limit. Had to slice with `python read()[a:b]` + `.encode('ascii','replace')` (Windows cp1252 console can't print its Unicode). Budget for this: **codex echoes every file it reads**, so the transcript is huge; the actual review + `<SUMMARY>` is a small slice near the front.
- **Quality:** genuinely good. Found 1 Medium (e2e console filter matched 5xx/429 by status alone → could mask same-origin regressions; allowlist cross-origin instead) + 2 Low (inaccurate eslint comment; cert regex didn't pin the Supabase origin). **All three were real and all three were fixed** (commit `2c87dd5`). It also independently confirmed the parts I claimed sound (env-restore finally, StubRetrieval 0 refs, runLiveRefresh behavior-preserving) and re-ran lint + targeted `bun test` to verify. Its own `bun run lint` shell call failed (`bun` not on codex's PowerShell PATH — same PATH gotcha as this repo) but it fell back to reading committed results.

## Rolling takeaways

- **qwen (`claude-9arm`) headless is gated.** The auto-mode classifier blocks `claude-9arm -p … --allowedTools Bash …` (unsupervised shell+write on a third-party agent) unless the user pre-authorizes it with a `Bash(claude-9arm:*)` allow rule (the skill's "one-time setup"). Without that rule, qwen delegation is unavailable mid-session — decide this **before** going AFK. Untested for quality this run.
- **clink → codex works well for read-only review/second-opinion** and is the better fit for *judgment-light but context-heavy* checks (adversarial review, diff sanity). It is not blocked by the classifier because it's an MCP tool. Cost: slow (~6 min) + a giant one-line result that must be sliced from the spill file. Worth it for a real review gate; overkill for trivial edits.
- **Prompt pattern that worked:** give codex the commit range + explicit per-file concerns + "do the `git diff` yourself" + "review only, do not edit." It followed all of it.
- **Net for this batch:** the delegation *experiment* paid off via clink (caught 3 real issues); qwen never ran. For trivial mechanical edits (E1/E2) doing them inline was faster than fighting the qwen gate.
