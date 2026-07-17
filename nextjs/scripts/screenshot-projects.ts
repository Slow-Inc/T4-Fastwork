/**
 * Screenshot worker (spec 2026-07-14, P4). Run by the `screenshot-projects`
 * GitHub Action (NOT in the serverless path — Playwright needs a real browser).
 *
 * For each published project that has a `live_url` but no `snapshot_image`, it
 * loads the site in Chromium, captures a cover screenshot, uploads it to the
 * Supabase Storage `project-shots` bucket, and writes the public URL back to the
 * row. Validation (HTTP ok, min size) guards against blank/broken captures; the
 * prior image is kept on failure. No-ops (exit 0) when env is unset so the
 * scheduled job is harmless until secrets are configured.
 */
import { chromium } from '@playwright/test';
import { createClient } from '@supabase/supabase-js';

// The project URL (not secret) — reuse the app's NEXT_PUBLIC_SUPABASE_URL locally
// so it isn't duplicated; CI sets the SUPABASE_URL repo secret, which wins.
const SUPABASE_URL =
  process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
// Supabase secret key (new-format `sb_secret_...`, or a legacy service_role JWT) —
// needs to bypass RLS to write the projects row + upload to Storage.
const SECRET_KEY = process.env.SUPABASE_SECRET_KEY;
const BUCKET = 'project-shots';
const MIN_BYTES = 5_000; // smaller than this ⇒ almost certainly a blank page

async function main(): Promise<void> {
  if (!SUPABASE_URL || !SECRET_KEY) {
    console.log('[screenshot] SUPABASE_URL / secret key not set — skipping.');
    return;
  }
  const db = createClient(SUPABASE_URL, SECRET_KEY);

  const { data: rows, error } = await db
    .from('projects')
    .select('id, slug, live_url')
    .eq('status', 'published')
    .not('live_url', 'is', null)
    .is('snapshot_image', null);
  if (error) throw error;
  if (!rows?.length) {
    console.log('[screenshot] nothing to capture.');
    return;
  }

  const browser = await chromium.launch();
  try {
    const ctx = await browser.newContext({
      viewport: { width: 1280, height: 800 },
      deviceScaleFactor: 2,
    });
    for (const row of rows as { id: number; slug: string; live_url: string }[]) {
      try {
        const page = await ctx.newPage();
        const res = await page.goto(row.live_url, {
          waitUntil: 'networkidle',
          timeout: 30_000,
        });
        if (!res || !res.ok()) {
          console.warn(`[screenshot] ${row.slug}: bad response, keeping prior.`);
          await page.close();
          continue;
        }
        const shot = await page.screenshot({ type: 'jpeg', quality: 80 });
        await page.close();
        if (shot.byteLength < MIN_BYTES) {
          console.warn(`[screenshot] ${row.slug}: blank capture, skipping.`);
          continue;
        }

        const path = `${row.slug}.jpg`;
        const up = await db.storage
          .from(BUCKET)
          .upload(path, shot, { contentType: 'image/jpeg', upsert: true });
        if (up.error) throw up.error;

        const { data: pub } = db.storage.from(BUCKET).getPublicUrl(path);
        await db
          .from('projects')
          .update({ snapshot_image: pub.publicUrl })
          .eq('id', row.id);
        console.log(`[screenshot] ${row.slug}: captured → ${pub.publicUrl}`);
      } catch (err) {
        console.warn(`[screenshot] ${row.slug}: failed —`, err);
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
