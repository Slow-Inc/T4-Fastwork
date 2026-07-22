---
name: security-review
description: Review authentication, authorization, RLS, admin writes, secrets, untrusted input, external requests, uploads, webhooks, and other trust-boundary changes in T4 Fastwork. Use before completing any security-sensitive change or when explicitly asked for a security review.
---

# Security Review

Review the actual diff and its surrounding execution path. Do not treat tests, type safety, or
app-layer guards as proof that a security boundary is safe.

## Review workflow

1. Read `CLAUDE.md`, the relevant requirement, and every applicable ADR. For auth, RLS, or
   admin-write paths, read `docs/adr/0007-db-enforced-authz-rls-is-app-admin.md`.
2. Map the trust boundary: actor, credentials, entry point, validation, authorization decision,
   privileged operation, data store, response, logs, and failure behavior.
3. Trace attacker-controlled data end to end. Check authentication versus authorization,
   ownership, tenant isolation, role changes, cache/session transitions, and direct API access.
4. Check input and protocol risks relevant to the change: injection, path traversal, unsafe URL
   fetches/SSRF, upload magic bytes and size limits, replay/idempotency, CSRF/CORS, open redirects,
   over-broad data exposure, rate limits, and denial-of-service amplification.
5. Check secrets and privileged clients. Never expose service credentials to browser code, logs,
   errors, fixtures, or committed configuration. Treat the NestJS database connection as
   privileged because it bypasses RLS.
6. Require fail-closed behavior at the authoritative boundary. App checks are defense in depth;
   database constraints/RLS or the privileged backend must enforce the invariant.
7. Run targeted tests plus the real-path verification required by `CLAUDE.md`. Add adversarial
   tests for unauthorized, cross-owner, malformed, duplicate, expired, and concurrent cases that
   apply.

## Output

Report actionable findings first, ordered by severity, with exact file and line references,
attack/failure scenario, impact, and the smallest safe remediation. Distinguish confirmed defects
from questions or residual risks. If no findings remain, state what was inspected and tested; do
not claim that the system is universally secure.

Do not modify code during a review-only request. If remediation is requested, follow TDD and
repeat this review after the fix.
