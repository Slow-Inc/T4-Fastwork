# ADR 0011 — Auto-publish generated content for public repos: repo visibility IS the publish authorization

**Status**: Accepted · 2026-07-22
**Relates to**: **supersedes the "must not auto-publish without the safety gate" position of [ADR 0009](0009-github-sourced-ai-authored-case-studies.md)** (§Consequences "unsafe auto-publish") — it keeps the rest of ADR 0009 unchanged (map-reduce generation, immutable revisions + overrides, manifest-hash idempotency, RAG ingest). Builds on the flat-authz decision (every linked team member is a full admin, no approval queues).
**Spec**: `docs/reports/2026-07-22-automation-remediation-roadmap.md` (decision D-A)

## Context

The North Star (`docs/superpowers/specs/2026-07-15-showcase-cms-vision.md` §1) is a showcase that
**adjusts itself automatically from GitHub, so the team does not hand-maintain it** — admin editing
is an optional override, not a required step.

ADR 0009 set a security boundary on the generation pipeline: *"public repos can contain secrets,
customer data, or prompt-injection in Markdown … generation must … not auto-publish without the
safety gate."* Its original design (DESIGN spec) also kept a **one-time human "Approve" click** per
newly-discovered project before it went public.

That human gate is the single remaining manual step between "push a repo" and "it's on the site" —
directly at odds with the North Star. The owner has decided how to resolve it.

## Decision

**A repo being PUBLIC is itself the authorization to publish its generated showcase content.**
Generated copy/case studies for a **public** repo **auto-publish** — no human approval, no
hold-for-review queue. Making a repo public is the member's own decision to expose it; the site
surfacing already-public content is within that authorization.

**What is KEPT from ADR 0009's safety gate — because it is code robustness, not a human step:**
- **Delimit untrusted Markdown** in the generation prompt (README/docs are untrusted input).
- **Validate the generated output** — `technologies[]` against the repo's real `languages`, `category`
  against the existing taxonomy — and drop unevidenced claims (anti-hallucination).
- **Keep the last safe revision** if a generation run fails or fails validation (never replace good
  published copy with a failed run — ADR 0009 D3/D4).
- **Optional** cheap secret-regex redact on generated copy (automated, not a gate).

These run automatically with zero friction and cover the one risk that "public = permission" does
**not**: a third party injecting content via a PR to a member's public README, hijacking the AI into
emitting malicious/false copy onto the live marketing site. That is a manipulation risk, not a
publish-permission question, so it stays guarded — by code, not a human.

## Rationale

- **Public visibility is a deliberate act.** A member choosing to make a repo public has already
  accepted that its content is exposed. The showcase amplifying it is within that scope.
- **A per-project human approval contradicts the North Star** for a 5-person trusted team; it is the
  exact "admin hand-maintains projects" step the automation is meant to remove.
- **Injection ≠ permission.** The residual third-party-injection risk is handled by automated
  input-delimiting + output-validation, so removing the *human* gate does not remove the *technical*
  protection.

## Consequences

- **No approval queue** for auto-generated projects; a newly-curated public repo's generated copy
  publishes directly after passing automated validation.
- **Member repo SELECTION stays admin/member-curated** — that is a different layer (which repos to
  *show* on a profile, decided in `admin/members/[id]/edit`), not a safety judgment. Auto-publish
  governs *whether generated content may go live*, not *which repos are chosen*.
- **Manual / CMS editorial content keeps its own flow** (ADR 0005 additive draft→approve is
  unchanged; this ADR is only about GitHub-sourced *generated* content).
- **Accepted residual risk:** a public repo that leaks a secret in its README could have it echoed
  into generated copy — it is already public, but the site amplifies it. Mitigated (optionally) by
  the secret-regex redact; the owner accepts the residual.
- **Every generation/publish change still triggers `/security-review`** (ADR 0009 discipline retained).
- Supersedes only ADR 0009's *publish-gate*; ADR 0009's generation architecture, revisions/overrides,
  and manifest idempotency remain in force.
