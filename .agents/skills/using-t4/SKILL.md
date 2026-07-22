---
name: using-t4
description: Route work in the T4 Fastwork repository through its canonical instructions, durable memory, implementation discipline, review gates, and engineering records. Use at the start of every T4 Fastwork repository task and whenever deciding which project workflow or skill applies.
---

# Using T4 Fastwork

Use this skill as the repository entry point. `CLAUDE.md` is the canonical workflow; `AGENTS.md`
adds autonomous-agent safety constraints.

## Start every repository task

1. Read `CLAUDE.md` in full and obey the stricter applicable rule from `AGENTS.md`.
2. Read `docs/OPEN-WORK-LEDGER.md` and `Obsidian-Fastwork/Home.md`.
3. Open only the vault notes, requirement section, ADR, issue, and source files relevant to the
   active task. Do not load the whole vault.
4. Use `karpathy-guidelines` before writing, changing, reviewing, or refactoring code.

## Route by phase

| Work | Required route |
|---|---|
| Answer, diagnose, or inspect | Read the relevant canonical docs and gather direct evidence; do not mutate state unless asked |
| Feature or bugfix | Requirement/issue → failing test → smallest implementation → targeted verification |
| Frontend change | Read the vendored Next.js docs, then run targeted tests and `bun run e2e` |
| Auth, RLS, admin write, upload, webhook, secret, or trust boundary | Use `security-review` before completion |
| Plan, design, PR, diff, audit, or second opinion | Use `scrutinize` and trace the actual end-to-end path |
| Validated bug, hard-to-reverse decision, or system-affecting change | Use `t4-engineering-records` |
| Durable cross-task lesson | Update one note in `Obsidian-Fastwork/` and link it from the relevant index/Home |

## Standing rules

- Keep changes surgical, reversible, and within the user's scope.
- TDD is mandatory for code behavior changes.
- Use Bun and the commands documented in `CLAUDE.md`.
- Read the relevant ADR before changing its area; supersede decisions with a new ADR.
- GitHub issue and PR bodies are bilingual; repository docs remain English unless explicitly
  requested otherwise.
- Verify the real path before claiming completion. Never infer success from an edit alone.
- Do not change shared machine-level tooling unless the user explicitly authorizes it.

Re-evaluate the route at each phase boundary. Loading this router does not replace using the
specific skill required by the table.
