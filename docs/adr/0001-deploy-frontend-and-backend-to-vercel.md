# 0001 — Deploy both the frontend and the backend to Vercel

Status: Accepted · Date: 2026-07-13

## Context

The product is a Bun monorepo with two apps (see `CLAUDE.md`):

- **`nextjs/`** — the Next.js 16 frontend (App Router).
- **`nestjs/`** — the Nest.js backend API: AI chat (RAG + streaming SSE) and the data
  layer. Keeping it a **separate, framework-agnostic API layer** was decided in the
  AI-Chatbot-Backend wayfinder map ([Slow-Inc/T4-Fastwork#1](https://github.com/Slow-Inc/T4-Fastwork/issues/1)).

How the frontend talks to the backend **today**:

- The chat UI (`nextjs/components/chat/chat-client.tsx`) is a **client component**, so the
  **browser** calls the backend directly with `fetch()` — it is not proxied through the
  Next.js server.
- Endpoints used: `POST /chat/stream` (Server-Sent Events streaming) and
  `POST /chat/scope-summary` (`nextjs/lib/scope-summary.ts`).
- Base URL comes from `process.env.NEXT_PUBLIC_API_BASE_URL` (falls back to
  `http://localhost:4100` in dev).
- The backend (`nestjs/src/main.ts`) enables **CORS** for `FRONTEND_ORIGIN` and listens on
  `PORT` (default 4100). It reaches Supabase through the **Supavisor transaction pooler
  (port 6543)** with Drizzle.

`CLAUDE.md` names the target as "Vercel, or self-hosted behind Cloudflare".

## Decision

**Deploy both apps to Vercel**, keeping the two-app monorepo structure — do **not** merge
the backend into Next.js route handlers, and do **not** move the backend to a separate
long-running host.

- **Frontend** → a Vercel project rooted at `nextjs/` (native Next.js target).
- **Backend** → a second Vercel project rooted at `nestjs/`, run as **Vercel Node.js
  serverless functions** (a single catch-all handler that boots the Nest app over its
  Express adapter; e.g. `nestjs/api/index.ts` + a `vercel.json` that routes all paths to
  it). Both projects deploy from the same Git repo, each with its own Root Directory.
- The browser continues to call the backend directly over HTTPS.
  `NEXT_PUBLIC_API_BASE_URL` is set (per Vercel environment) to the backend project's
  public URL; the backend's `FRONTEND_ORIGIN` is set to the frontend's URL for CORS.

## Consequences

Things this makes true, and the constraints to respect when implementing the deploy:

- **One platform, scale-to-zero for both.** No second vendor to run/pay for the API.
- **SSE within the function time limit.** Vercel Node functions can stream responses, but
  execution time is capped by plan (tens of seconds up to a few minutes). A chat turn's
  stream must finish inside that window — size `maxDuration` accordingly and keep replies
  bounded. This is the main risk of running the streaming API serverless.
- **Cold starts** on the backend function add latency to the first request after idle.
- **Supabase access is serverless-safe** because we already use the transaction pooler
  (6543); keep `prepare: false` (as `conversation-log.service.ts` does).
- **CORS stays required** (browser → cross-origin API). Alternatively, a Next.js `rewrites`
  proxy (`/api/* → backend`) could make the API same-origin and hide its URL — noted as a
  future option, not adopted now.
- **Env-var name mismatch to fix before deploy:** the code reads
  `NEXT_PUBLIC_API_BASE_URL`, but `nextjs/.env.example` documents `NEXT_PUBLIC_API_URL`.
  Reconcile the two (pick one name) so the deployed frontend can find the backend.
- Two Vercel projects mean **two sets of environment variables** and two deploy pipelines
  to keep in sync.

## Alternatives considered

- **Merge the backend into Next.js Route Handlers** (`app/api/*` streaming via
  `ReadableStream`) — genuinely serverless-native and removes CORS, and the RAG modules are
  framework-agnostic enough to port. **Rejected** to preserve the separate Nest.js API
  layer decided in wayfinder #1.
- **Frontend on Vercel + Nest.js on a long-running host** (Railway/Render/Fly) — least code
  change and no SSE time limit. **Rejected** because the goal is fully serverless on Vercel.
