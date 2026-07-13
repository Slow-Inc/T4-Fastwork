# 0002 — Use Cloudflare Turnstile instead of Google reCAPTCHA

Status: Accepted · Date: 2026-07-13

## Context

The public forms were bot-gated with **Google reCAPTCHA v3** (invisible scoring): the
contact form (`nextjs/app/contact`) and the chat endpoint guard
(`nestjs/src/security`). Both were feature-flagged — unset secret = no-op.

reCAPTCHA has **usage limits/quotas** (and enterprise pricing at scale) and ties us to
Google. The team already runs on **Cloudflare** across the stack (CDN/DNS/WAF/Tunnel; see
ADR 0001 / `CLAUDE.md`).

## Decision

Replace reCAPTCHA v3 with **Cloudflare Turnstile** everywhere.

- **No usage limits, free**, privacy-friendly, and native to our Cloudflare stack.
- Verification endpoint: `https://challenges.cloudflare.com/turnstile/v0/siteverify`.
- **Env renamed** (feature-flag behavior preserved — unset = no-op):
  - Frontend: `NEXT_PUBLIC_RECAPTCHA_SITE_KEY` → `NEXT_PUBLIC_TURNSTILE_SITE_KEY`,
    `RECAPTCHA_SECRET` → `TURNSTILE_SECRET`.
  - Backend: `RECAPTCHA_SECRET` → `TURNSTILE_SECRET`.

## Consequences

- **Pass/fail, not a score.** Turnstile returns `{ success }` with no 0–1 score, so the
  `minScore` threshold logic was removed from both the frontend check and the chat guard.
- **Simpler contact-form wiring.** The reCAPTCHA v3 execute-on-submit dance is gone;
  instead an implicit `.cf-turnstile` widget (`data-appearance="interaction-only"`) renders
  when a site key is set and injects the token as `turnstileToken` into the form.
- Files: `nextjs/lib/turnstile.ts` (+ test), `components/site/turnstile-script.tsx`,
  `app/contact/{contact-form,actions}.tsx/ts`, and backend
  `src/security/turnstile.{verifier,guard}.ts` (+ spec) — the old `recaptcha.*` files were
  removed. The pluggable-verifier + feature-flag structure was kept, so the swap was
  contained.
- **Setup (manual, no MCP):** create a Turnstile widget in the Cloudflare dashboard, then
  set the site key + secret in each environment's env vars.
- **Unchanged pre-existing gap:** the chat endpoint guard reads `turnstileToken` from the
  request body, but the floating chat frontend does not send one — so with a secret set the
  chat guard would block. It stays feature-flagged off in practice; wiring the chat token is
  a separate follow-up, out of scope for this provider swap.
