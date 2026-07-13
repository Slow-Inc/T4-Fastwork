// One-off: generate committed cert display assets (webp) + copy originals into
// nextjs/public/certificates/<slug>/. The OUTPUT (public/certificates/*) is committed;
// this script is kept only for provenance/reproducibility and is NOT part of the build.
//
// It needs deps that are intentionally NOT in the app (they're heavy, dev-only). Run it
// from a throwaway dir:  bun add sharp pdfjs-dist @napi-rs/canvas && node build-cert-assets.mjs
// SRC below points at the raw certificate files on the maintainer's machine.
import { getDocument } from 'pdfjs-dist/legacy/build/pdf.mjs';
import { createCanvas } from '@napi-rs/canvas';
import sharp from 'sharp';
import { mkdirSync, copyFileSync, readFileSync } from 'node:fs';
import { join, extname } from 'node:path';

const SRC = 'C:/Users/xenod/Downloads/Certificate';
const OUT = 'D:/Github/T4 Fastwork/nextjs/public/certificates';

// slug, id, and real source files (img = png/jpg, pdf = pdf). Verified by reading each file.
const entries = [
  { slug: 'xenodev', id: 'ai-for-all', dir: 'xeno',
    img: 'AI_for_All_From_Basics_to_GenAI_Practice_AI_for_All_From_Basics_to_GenAI_Practice_-_Course_Completion_Certificate.png',
    pdf: 'AI for All From Basics to GenAI Practice_AI for All From Basics to GenAI Practice - Course Completion Certificate.pdf' },
  { slug: 'xenodev', id: 'road-to-data-scientists', dir: 'xeno',
    img: 'Datascience_-50--1.png',
    pdf: 'Datascience เตรียมอุดมศึกษาภาคใต้-50-ธีรตุม์.pdf' },
  { slug: 'xenodev', id: 'basic-data-analytics', dir: 'xeno',
    img: 'certificate_SIIT.jpg' },
  { slug: 'xenodev', id: 'to-be-it-67', dir: 'xeno',
    img: 'certificate_ToBeIT67.png' },

  { slug: 'thanathornz', id: 'cyber-security-awareness', dir: 'thanathorn',
    pdf: 'ส่งออกประกาศนียบัตรออนไลน์ - 2025-10-06-23-23.pdf' },
  { slug: 'thanathornz', id: 'ai-governance-ethics', dir: 'thanathorn',
    pdf: 'ส่งออกประกาศนียบัตรออนไลน์ - 2025-10-06-23-26.pdf' },
  { slug: 'thanathornz', id: 'entrepreneurial-mindset', dir: 'thanathorn',
    pdf: 'Certificate-SED1007-TH.pdf' },
  { slug: 'thanathornz', id: 'genai-for-app-developers', dir: 'thanathorn',
    pdf: 'CERTIFICATE.pdf' },
  { slug: 'thanathornz', id: 'english-b1-2', dir: 'thanathorn',
    pdf: 'certificate (1).pdf' },

  { slug: 'paradise', id: 'road-to-data-scientists', dir: 'cable',
    img: 'Datascience_-41--1.png',
    pdf: 'Datascience เตรียมอุดมศึกษาภาคใต้-41-สุคีรินทร์.pdf' },
];

async function pdfPage1ToPng(pdfPath) {
  const data = new Uint8Array(readFileSync(pdfPath));
  const doc = await getDocument({ data, useSystemFonts: true, isEvalSupported: false }).promise;
  const page = await doc.getPage(1);
  const viewport = page.getViewport({ scale: 2 });
  const canvas = createCanvas(Math.ceil(viewport.width), Math.ceil(viewport.height));
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  await page.render({ canvasContext: ctx, viewport, canvas }).promise;
  return canvas.toBuffer('image/png');
}

for (const e of entries) {
  const destDir = join(OUT, e.slug);
  mkdirSync(destDir, { recursive: true });

  // Copy originals (for download), normalised to <id>.<ext>
  if (e.img) {
    const ext = extname(e.img).toLowerCase();
    copyFileSync(join(SRC, e.dir, e.img), join(destDir, e.id + ext));
  }
  if (e.pdf) {
    copyFileSync(join(SRC, e.dir, e.pdf), join(destDir, e.id + '.pdf'));
  }

  // Display webp: prefer the raster image; else rasterise the PDF's first page.
  let raster;
  if (e.img) raster = readFileSync(join(SRC, e.dir, e.img));
  else raster = await pdfPage1ToPng(join(SRC, e.dir, e.pdf));

  await sharp(raster)
    .resize({ width: 1400, withoutEnlargement: true })
    .webp({ quality: 82 })
    .toFile(join(destDir, e.id + '.webp'));

  console.log(`ok ${e.slug}/${e.id}  img=${!!e.img} pdf=${!!e.pdf}`);
}
console.log('DONE');
