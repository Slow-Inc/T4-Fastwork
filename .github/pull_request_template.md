<!--
Bilingual body required (English + a full Thai mirror) — CLAUDE.md, Writing conventions.
Reference the issue: `Closes #N` only if this PR delivers ALL of it; otherwise `Refs #N` and say
what is deferred. Auto-closing an issue a PR did not finish has already lost work here.
-->

## EN



## TH



---

## Pre-merge gate

<!--
Fill this in IMMEDIATELY BEFORE merging, not when opening the PR. Blank fields are the signal that
the gate did not run — that is the whole point of them being fields and not checkboxes.
Applicability is the merge action, never the content: docs-only and ADR-only take the full gate.
`bun run scripts/gate-audit.ts` reads these back from the PR comments after the fact.
-->

- Review target: `git diff origin/master...HEAD`
- **Reviewed HEAD (full 40-char SHA, from `git rev-parse HEAD` — not from memory):**
- **`code-review` evidence (PR comment URL):**
- **`scrutinize` evidence (PR comment URL):**
- **`security-review`:** <!-- URL if run · or "not triggered" + the concrete reason it is not -->
- PR HEAD still equals the reviewed HEAD? <!-- if it moved, both reviews are stale: rerun and repost -->

<!--
Why a full SHA and a URL rather than a tick: a tick is cheaper to make than to earn. A SHA that must
match the merged head, and a URL that must resolve, both leave a trace when they are absent — and the
audit script compares that SHA against the commit the PR actually merged.
-->
