# Post-mortem — image chat 413 on prod (t4labs.dev), #103

## Summary

Sending an image to the AI chatbot on t4labs.dev failed with "ขออภัยครับ ตอนนี้เชื่อมต่อผู้ช่วย AI
ไม่ได้ …" while text chat worked. Inline images are base64 data URLs (>100 KB), but the 12 MB JSON
body limit was set only in `nestjs/src/main.ts` — and Vercel runs `nestjs/api/index.ts`, not
`main.ts`, so prod used Express's 100 KB default and returned **413** on image payloads. Fixed by
extracting a shared `configureApp(app)` (CORS allow-list + 12 MB limit) that both entrypoints call, so
they can't drift. #103, PR #104 (`ecc2998`), owner: agent session.

## Symptom

- User report: image chat → "ขออภัยครับ ตอนนี้เชื่อมต่อผู้ช่วย AI ไม่ได้ ลองใหม่อีกครั้ง …"; text chat fine.
- Deterministic repro against the prod backend `POST https://t4-fastwork-nestjs.vercel.app/chat/stream`:
  - ~10-byte body → **HTTP 201**
  - ~300 KB body → **HTTP 413 Payload Too Large**

## Root cause

`nestjs/src/main.ts:14` set `app.useBodyParser('json', { limit: '12mb' })` for inline base64 images
(#42). But on Vercel the backend is the serverless handler `nestjs/api/index.ts`
(`NestFactory.create(AppModule).getHttpAdapter().getInstance()`), **not** `main.ts` — and
`api/index.ts` never called `useBodyParser`, so its Express instance used the **100 KB default**
`body-parser` JSON limit. A chat turn carrying an image serializes the base64 data URL into the
`POST /chat/stream` body, which exceeds 100 KB → `body-parser` throws `entity.too.large` → Express
returns 413 before the request reaches the `ChatController.stream` handler, DTO validation, or
Turnstile.

## Why it produced the symptom

The browser sends the chat turn as a fetch-based SSE `POST` to the backend. On 413 the fetch resolves
to a non-OK response, not a stream; the frontend chat client treats any non-stream/errored response as
"can't reach the assistant" and renders the fixed fallback string. Text turns are a few hundred bytes —
far under 100 KB — so they pass the parser and stream normally, which is why only image chat broke.

## Fix

PR #104 extracts `nestjs/src/configure-app.ts` — a single `configureApp(app)` applying **both** the
multi-origin CORS allow-list (`parseAllowedOrigins(FRONTEND_ORIGIN)`) and
`app.useBodyParser('json', { limit: '12mb' })` — and calls it from **both** `src/main.ts` and
`api/index.ts` right after `NestFactory.create(...)`. `api/index.ts` now types the app as
`NestExpressApplication` (required for `useBodyParser`). This addresses the root cause (prod now applies
the 12 MB limit) and the *class* (the two entrypoints share one config, so bootstrap settings can no
longer live in one and be missing from the other).

**Prior related fix:** the CORS bug #94/#96 was the same `main.ts`-vs-`api/index.ts` drift — #96 fixed
CORS in `api/index.ts` but left the body limit still only in `main.ts`. #104 unifies both so a third
instance can't recur.

## How it was found

- Repro made deterministic by hitting `POST /chat/stream` directly with a small vs a ~300 KB JSON body:
  201 vs 413.
- Source trace: `grep` showed `useBodyParser` in `main.ts` but nothing in `api/index.ts` — the same
  file-split as the CORS bug.
- Hypothesis rejected: "Vercel's 4.5 MB platform body limit is rejecting it." Disproved by the repro —
  300 KB is well under 4.5 MB yet still 413, so the cap is the app-level 100 KB `body-parser` default,
  not the platform.
- Confirming experiment: after deploy, the same 300 KB `POST` returned **201** (not 413).

## Why it slipped through

Latent drift + coverage gap. The 12 MB limit was correct in `main.ts` when written, but prod's real
entrypoint (`api/index.ts`) was authored separately and never received it. No test exercised the
serverless handler's body limit, and the image-chat E2E (#42) mocks the chat stream (`page.route`), so
it never sends a real large body to the real backend. The CORS fix (#96) touched the same file but
addressed only its own symptom, leaving this one latent.

## Validation

- Prod, post-deploy: `POST https://t4-fastwork-nestjs.vercel.app/chat/stream` with a ~300 KB body →
  **HTTP 201** (was 413); ~10-byte body → 201 (unchanged). The body parser now accepts the image
  payload.
- `nestjs` unit: **238 pass** incl. new `test/configure-app.spec.ts` (asserts the 12 MB limit + the
  parsed CORS origins). `nest build` + `eslint` exit 0. `AppModule` boots with `configureApp` applied.
- Coverage honesty: validated by the raw-body-size probe against prod + the config seam unit test. A
  full browser image-upload round-trip on t4labs.dev was **not** re-run end-to-end; the 413 was proven
  gone at the layer that caused it.

## Action items / follow-ups

- Regression coverage lives in `test/configure-app.spec.ts` (the shared seam). No per-entrypoint test
  (the drift is now structurally impossible — one function, two callers). Owner: agent. Done in #104.
- Known bound, not this bug: Vercel serverless caps a request body at ~4.5 MB; images larger than that
  still fail at the platform layer. If large-image chat is needed, move images off the JSON body (direct
  Storage upload + reference). Not filed — raise if it surfaces.
