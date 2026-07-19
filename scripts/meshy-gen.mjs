#!/usr/bin/env node
/**
 * meshy-gen.mjs — generate a 3D model from a text prompt via the Meshy AI API
 * and download the GLB. Full async flow: preview → poll → refine → poll →
 * download. Used to source the /lab hero robot (a ChainGPT-style companion bot)
 * before refining materials + the rainbow rim in Blender.
 *
 * Auth: reads MESHY_API_KEY from the environment, falling back to a gitignored
 * `.env.meshy` at the repo root (KEY=VALUE lines). The key is NEVER committed.
 *
 * Usage:
 *   node scripts/meshy-gen.mjs "a cute companion robot ..." --out nextjs/public/lab/robot-meshy.glb
 *   node scripts/meshy-gen.mjs "..." --preview-only            # cheap preview first
 *   node scripts/meshy-gen.mjs --refine <preview_id> --out out.glb   # refine an existing preview
 *
 * Flags: --out <path> (default ./meshy-out.glb) · --model <meshy-6|meshy-5|latest>
 *        --polycount <n> · --pose <a-pose|t-pose|""> · --pbr · --hd
 *        --preview-only · --refine <preview_task_id> · --lowpoly
 */
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';

const API = 'https://api.meshy.ai/openapi/v2/text-to-3d';

// ---- load key (env first, then .env.meshy at repo root) --------------------
function loadKey() {
  if (process.env.MESHY_API_KEY) return process.env.MESHY_API_KEY.trim();
  const envFile = resolve(process.cwd(), '.env.meshy');
  if (existsSync(envFile)) {
    const content = readFileSync(envFile, 'utf8').replace(/^﻿/, '');
    for (const line of content.split(/\r?\n/)) {
      const m = line.match(/^\s*MESHY_API_KEY\s*=\s*(.+?)\s*$/);
      if (m) return m[1].replace(/^["']|["']$/g, '').trim();
    }
  }
  console.error(
    'ERROR: MESHY_API_KEY not found. Set it in the env or create a gitignored\n' +
      '`.env.meshy` at the repo root with:  MESHY_API_KEY=msy_your_key_here',
  );
  process.exit(1);
}

// ---- tiny arg parser -------------------------------------------------------
function parseArgs(argv) {
  const a = { out: './meshy-out.glb', model: 'meshy-6', polycount: 30000, pose: 'a-pose' };
  const rest = [];
  for (let i = 0; i < argv.length; i++) {
    const t = argv[i];
    if (t === '--out') a.out = argv[++i];
    else if (t === '--model') a.model = argv[++i];
    else if (t === '--polycount') a.polycount = parseInt(argv[++i], 10);
    else if (t === '--pose') a.pose = argv[++i];
    else if (t === '--refine') a.refine = argv[++i];
    else if (t === '--pbr') a.pbr = true;
    else if (t === '--hd') a.hd = true;
    else if (t === '--lowpoly') a.lowpoly = true;
    else if (t === '--preview-only') a.previewOnly = true;
    else rest.push(t);
  }
  a.prompt = rest.join(' ').trim();
  return a;
}

const KEY = loadKey();
const H = { Authorization: `Bearer ${KEY}`, 'Content-Type': 'application/json' };

async function post(body) {
  const r = await fetch(API, { method: 'POST', headers: H, body: JSON.stringify(body) });
  const j = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(`POST ${r.status}: ${JSON.stringify(j)}`);
  return j.result; // task id
}

async function poll(id, label) {
  process.stdout.write(`${label} ${id}\n`);
  let last = -1;
  for (;;) {
    const r = await fetch(`${API}/${id}`, { headers: H });
    const j = await r.json();
    if (j.status === 'SUCCEEDED') {
      console.log(`  ✓ ${label} done — ${j.consumed_credits ?? '?'} credits`);
      return j;
    }
    if (j.status === 'FAILED' || j.status === 'CANCELED') {
      throw new Error(`${label} ${j.status}: ${JSON.stringify(j.task_error || j)}`);
    }
    if (j.progress !== last) {
      process.stdout.write(`  … ${j.status} ${j.progress ?? 0}%\r`);
      last = j.progress;
    }
    await new Promise((f) => setTimeout(f, 5000));
  }
}

async function download(url, outPath) {
  const abs = resolve(process.cwd(), outPath);
  mkdirSync(dirname(abs), { recursive: true });
  const r = await fetch(url);
  if (!r.ok) throw new Error(`download ${r.status}`);
  const buf = Buffer.from(await r.arrayBuffer());
  writeFileSync(abs, buf);
  console.log(`  ⬇ saved ${abs} (${(buf.length / 1024).toFixed(0)} KB)`);
}

async function main() {
  const a = parseArgs(process.argv.slice(2));

  let previewId = a.refine;
  if (!previewId) {
    if (!a.prompt) {
      console.error('ERROR: provide a text prompt (or --refine <preview_id>).');
      process.exit(1);
    }
    console.log(`Prompt: ${a.prompt}`);
    previewId = await post({
      mode: 'preview',
      prompt: a.prompt.slice(0, 600),
      ai_model: a.model,
      model_type: a.lowpoly ? 'lowpoly' : 'standard',
      topology: 'triangle',
      target_polycount: a.polycount,
      pose_mode: a.pose,
      should_remesh: true,
      target_formats: ['glb'],
    });
    await poll(previewId, 'preview');
    if (a.previewOnly) {
      console.log(`\npreview_task_id: ${previewId}`);
      console.log(`refine later with:  node scripts/meshy-gen.mjs --refine ${previewId} --out ${a.out}`);
      return;
    }
  }

  const refineId = await post({
    mode: 'refine',
    preview_task_id: previewId,
    enable_pbr: !!a.pbr,
    hd_texture: !!a.hd,
    ai_model: a.model,
    target_formats: ['glb'],
  });
  const refined = await poll(refineId, 'refine');
  const glb = refined.model_urls?.glb;
  if (!glb) throw new Error(`no glb in response: ${JSON.stringify(refined.model_urls)}`);
  await download(glb, a.out);
  console.log('\nDone.');
}

main().catch((e) => {
  console.error('\nFAILED:', e.message);
  process.exit(1);
});
