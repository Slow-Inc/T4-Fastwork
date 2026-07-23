---
tags:
  - delivery-quality
  - frontend
  - verification
description: Prevent visual verification against a stale long-running Next.js server.
---

# Frontend Verification Must Use the Current Build

## Symptom

A project page rendered new React markup while its newly added CSS selectors were absent from the
loaded stylesheet. Browser screenshots therefore looked unstyled even though the source file
contained the rules.

## Verified cause

Port 3000 was owned by a long-running Next.js development server started before the active branch.
The component graph refreshed, but the served CSS bundle did not contain the new selectors.
Inspecting `document.styleSheets` showed no `.project-brief` rule. A fresh production build served
on a separate port included the rule and produced the intended computed styles.

## Prevention rule

Before accepting frontend visual evidence, resolve the process that owns the test port and prove
the loaded stylesheet contains a selector changed by the current branch. Do not assume that a
successful navigation means the browser is using the current build.

Do not stop an unknown long-running process without authorization. Either use an isolated port and
fresh build, or obtain permission to stop the exact listener so the canonical E2E command can own
its server lifecycle.

## Verification

- inspect the owning process for the target port;
- run a fresh production build;
- verify a changed selector via computed style or `document.styleSheets`;
- run the full Playwright suite with the stale listener removed.
