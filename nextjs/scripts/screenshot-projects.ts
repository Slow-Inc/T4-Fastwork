/**
 * Screenshot worker (spec 2026-07-14, P4 / #161). Run by the `screenshot-projects`
 * GitHub Action (NOT in the serverless path — Playwright needs a real browser).
 *
 * For each published project that has a `live_url` but no `snapshot_image`, it
 * loads the site in Chromium, captures a cover screenshot, uploads it to the
 * Supabase Storage `project-shots` bucket, and writes the public URL back to the
 * row. When capture fails (bad HTTP, blank, exception), falls back to the page's
 * `og:image` / `twitter:image` URL so cards are not empty forever. Validation
 * (HTTP ok, min size) guards against blank/broken captures; the prior image is
 * kept on failure with no OG. No-ops (exit 0) when env is unset so the scheduled
 * job is harmless until secrets are configured.
 *
 * AFK / cron: `.github/workflows/screenshot-projects.yml` every 6h + workflow_dispatch.
 */
import { chromium } from '@playwright/test';
import { createClient } from '@supabase/supabase-js';
import {
  isCaptureUsable,
  resolveOgFallbackUrl,
  selectSnapshotTargets,
} from '../lib/snapshot-cover';

// The project URL (not secret) — reuse the app's NEXT_PUBLIC_SUPABASE_URL locally
// so it isn't duplicated; CI sets the SUPABASE_URL repo secret, which wins.
const SUPABASE_URL =
  process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
// Supabase secret key (new-format `sb_secret_...`, or a legacy service_role JWT) —
// needs to bypass RLS to write the projects row + upload to Storage.
const SECRET_KEY = process.env.SUPABASE_SECRET_KEY;
const BUCKET = 'project-shots';
const MIN_BYTES = 5_000; // smaller than this ⇒ almost certainly a blank page

// On-demand revalidation (#92): a direct-DB write doesn't bust the site's ISR
// cache, so tell the deployed app to re-read the updated project. Best-effort —
// the image is already persisted; if this is unconfigured or fails, the page
// still picks it up on the next revalidation/deploy. In CI the secret is the
// `BACKEND_REFRESH_SECRET` Actions secret (GitHub reserves the GITHUB_ prefix);
// it must equal the app's runtime GITHUB_REFRESH_SECRET.
const SITE_URL = process.env.SITE_URL ?? process.env.NEXT_PUBLIC_SITE_URL;
const REFRESH_SECRET =
  process.env.BACKEND_REFRESH_SECRET ?? process.env.GITHUB_REFRESH_SECRET;

async function revalidateProject(slug: string): Promise<void> {
  if (!SITE_URL || !REFRESH_SECRET) return;
  try {
    await fetch(
      `${SITE_URL}/api/revalidate?slug=${encodeURIComponent(slug)}`,
      { method: 'POST', headers: { 'x-refresh-secret': REFRESH_SECRET } },
    );
  } catch {
    // best-effort — DB already holds the new image
  }
}

// Untyped Supabase client — this Action script has no generated Database
// schema; `createClient()` without generics makes `.update()` expect `never`.
// Keep the worker script operational rather than inventing a schema package.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type ShotDb = any;

async function writeSnapshot(
  db: ShotDb,
  row: { id: number; slug: string },
  url: string,
  via: 'playwright' | 'og',
): Promise<void> {
  await db.from('projects').update({ snapshot_image: url }).eq('id', row.id);
  await revalidateProject(row.slug);
  console.log(`[screenshot] ${row.slug}: ${via} → ${url}`);
}
async function fetchHtml(url: string): Promise<string | null> {
  try {
    const res = await fetch(url, {
      redirect: 'follow',
      headers: {
        'user-agent':
          'Mozilla/5.0 (compatible; T4LabsSnapshotBot/1.0; +https://t4labs.dev)',
        accept: 'text/html',
      },
      signal: AbortSignal.timeout(20_000),
    });
    if (!res.ok) return null;
    return await res.text();
  } catch {
    return null;
  }
}

async function applyOgFallback(
  db: ShotDb,
  row: { id: number; slug: string; live_url: string },
  html: string | null,
): Promise<boolean> {
  const og = resolveOgFallbackUrl({
    captureUsable: false,
    html,
    pageUrl: row.live_url,
  });
  if (!og) return false;
  await writeSnapshot(db, row, og, 'og');
  return true;
}

async function main(): Promise<void> {
  if (!SUPABASE_URL || !SECRET_KEY) {
    console.log('[screenshot] SUPABASE_URL / secret key not set — skipping.');
    return;
  }
  const db = createClient(SUPABASE_URL, SECRET_KEY) as ShotDb;

  const { data: rows, error } = await db
    .from('projects')
    .select('id, slug, status, live_url, snapshot_image')
    .eq('status', 'published')
    .not('live_url', 'is', null)
    .is('snapshot_image', null);
  if (error) throw error;
  const targets = selectSnapshotTargets(
    (rows ?? []) as {
      id: number;
      slug: string;
      status: string;
      live_url: string | null;
      snapshot_image: string | null;
    }[],
  );
  if (!targets.length) {
    console.log('[screenshot] nothing to capture.');
    return;
  }

  const browser = await chromium.launch();
  try {
    const ctx = await browser.newContext({
      viewport: { width: 1280, height: 800 },
      deviceScaleFactor: 2,
      // Present as a normal Chrome, not the default "HeadlessChrome" UA (which
      // CDNs/bot filters flag), and a real locale — legit for shooting our own sites.
      userAgent:
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 ' +
        '(KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      locale: 'en-US',
    });
    for (const row of targets) {
      try {
        const page = await ctx.newPage();
        // `networkidle` is unreliable on a live app — polling/analytics/long-lived
        // connections keep the network busy, so it never settles and times out even
        // though the page rendered fine (Playwright discourages it). Navigate on
        // `domcontentloaded`, then best-effort wait for `load` + a short settle so
        // the hero/fonts have painted before the shot.
        const res = await page.goto(row.live_url, {
          waitUntil: 'domcontentloaded',
          timeout: 45_000,
        });
        if (!res || !res.ok()) {
          console.warn(
            `[screenshot] ${row.slug}: bad response (status=${res?.status() ?? 'none'}) — trying OG.`,
          );
          await page.close();
          const html = await fetchHtml(row.live_url);
          if (!(await applyOgFallback(db, row, html))) {
            console.warn(`[screenshot] ${row.slug}: no OG fallback.`);
          }
          continue;
        }
        await page.waitForLoadState('load', { timeout: 15_000 }).catch(() => {});
        await page.waitForTimeout(2_500);
        const shot = await page.screenshot({ type: 'jpeg', quality: 80 });
        const html = await page.content().catch(() => null);
        await page.close();

        if (!isCaptureUsable(shot, MIN_BYTES)) {
          console.warn(
            `[screenshot] ${row.slug}: blank capture — trying OG.`,
          );
          if (!(await applyOgFallback(db, row, html))) {
            console.warn(`[screenshot] ${row.slug}: no OG fallback.`);
          }
          continue;
        }

        const path = `${row.slug}.jpg`;
        const up = await db.storage
          .from(BUCKET)
          .upload(path, shot, { contentType: 'image/jpeg', upsert: true });
        if (up.error) throw up.error;

        const { data: pub } = db.storage.from(BUCKET).getPublicUrl(path);
        await writeSnapshot(db, row, pub.publicUrl, 'playwright');
      } catch (err) {
        console.warn(`[screenshot] ${row.slug}: failed —`, err);
        try {
          const html = await fetchHtml(row.live_url);
          if (!(await applyOgFallback(db, row, html))) {
            console.warn(`[screenshot] ${row.slug}: no OG fallback.`);
          }
        } catch (ogErr) {
          console.warn(`[screenshot] ${row.slug}: OG fallback failed —`, ogErr);
        }
      }
    }
  } finally {
    await browser.close();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
