/**
 * Live spike for wayfinder #9 — run against the real 9arm gateway:
 *   bun src/llm/spike.ts
 *
 * Measures first-token latency (TTFT) and checks whether the model reliably
 * emits `[PROJECT:slug]` / `[SERVICE:id]` markers when instructed, feeding the
 * stream through the same StreamMarkerParser the chat endpoint will use.
 * Not a unit test (no `.spec` suffix) — it hits the network.
 */
import OpenAI from 'openai';
import { StreamMarkerParser, type CardRef } from '../chat/marker-parser';
import { buildSystemPrompt } from '../chat/system-prompt';

const SYSTEM = buildSystemPrompt({
  language: 'th',
  retrieved: [
    { kind: 'project', ref: 'fin-track', title: 'FinTrack', summary: 'SaaS dashboard การเงินสำหรับ startup' },
    { kind: 'project', ref: 'book-easy', title: 'BookEasy', summary: 'ระบบจองโรงแรม' },
    { kind: 'service', ref: '1', title: 'SaaS Platform', summary: 'พัฒนา SaaS Platform ครบวงจร' },
  ],
});

const USER = 'อยากได้ระบบ dashboard การเงินสำหรับ startup ทำได้ไหม';

async function main() {
  const client = new OpenAI({
    apiKey: process.env.CUSTOM_OPENAI_API_KEY,
    baseURL: process.env.CUSTOM_OPENAI_API_BASE,
  });
  const model = process.env.CUSTOM_OPENAI_MODEL ?? 'qwen3.6-35b-a3b';

  const start = performance.now();
  const stream = await client.chat.completions.create({
    model,
    messages: [
      { role: 'system', content: SYSTEM },
      { role: 'user', content: USER },
    ],
    stream: true,
  });

  const parser = new StreamMarkerParser();
  let ttft = -1;
  let raw = '';
  let text = '';
  const cards: CardRef[] = [];

  for await (const chunk of stream) {
    const delta = chunk.choices[0]?.delta?.content;
    if (!delta) continue;
    if (ttft < 0) ttft = performance.now() - start;
    raw += delta;
    for (const ev of parser.push(delta)) {
      if (ev.type === 'text') text += ev.value;
      else cards.push(ev.card);
    }
  }
  for (const ev of parser.flush()) {
    if (ev.type === 'text') text += ev.value;
    else cards.push(ev.card);
  }
  const total = performance.now() - start;

  console.log('=== SPIKE RESULT ===');
  console.log('model            :', model);
  console.log('TTFT ms          :', ttft < 0 ? 'n/a' : Math.round(ttft));
  console.log('total ms         :', Math.round(total));
  console.log('markers emitted  :', cards.length, JSON.stringify(cards));
  console.log('--- raw (with markers) ---');
  console.log(raw);
  console.log('--- parsed text (markers stripped) ---');
  console.log(text);
}

main().catch((e) => {
  console.error('SPIKE ERROR:', e?.message ?? e);
  process.exit(1);
});
