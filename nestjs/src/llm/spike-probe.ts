/** Diagnostic: inspect stream chunk shape + time-to-first-ANY-token. */
import OpenAI from 'openai';

const client = new OpenAI({
  apiKey: process.env.CUSTOM_OPENAI_API_KEY,
  baseURL: process.env.CUSTOM_OPENAI_API_BASE,
});
const model = process.env.CUSTOM_OPENAI_MODEL ?? 'qwen3.6-35b-a3b';

async function main() {
  const start = performance.now();
  const stream = (await client.chat.completions.create({
    model,
    messages: [{ role: 'user', content: 'ตอบสั้นๆ: 2+2 เท่ากับเท่าไหร่' }],
    stream: true,
  } as never)) as unknown as AsyncIterable<{ choices: { delta?: Record<string, unknown> }[] }>;

  let firstAny = -1;
  let firstContent = -1;
  let reasoningSeen = false;
  let i = 0;
  for await (const chunk of stream) {
    const delta = chunk.choices[0]?.delta ?? {};
    if (firstAny < 0) {
      firstAny = performance.now() - start;
      console.log('first delta keys:', Object.keys(delta), JSON.stringify(delta).slice(0, 200));
    }
    if ((delta as Record<string, unknown>).reasoning_content) reasoningSeen = true;
    if ((delta as { content?: string }).content && firstContent < 0) {
      firstContent = performance.now() - start;
    }
    if (++i > 8 && firstContent > 0) break;
  }
  console.log('time-to-first-ANY-token ms    :', Math.round(firstAny));
  console.log('time-to-first-CONTENT-token ms:', firstContent < 0 ? 'n/a' : Math.round(firstContent));
  console.log('reasoning_content seen        :', reasoningSeen);
}
main().catch((e) => { console.error('ERR', e?.message ?? e); process.exit(1); });
