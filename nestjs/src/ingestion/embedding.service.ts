import { Injectable } from '@nestjs/common';
import OpenAI from 'openai';

/**
 * OpenAI-compatible embeddings (bge-m3 via the 9arm gateway). Lazy client so
 * module boot doesn't require the key. Blocked until bge-m3 is enabled on the
 * gateway team key (#14) — until then calls 403.
 */
@Injectable()
export class EmbeddingService {
  private client?: OpenAI;
  private readonly model =
    process.env.CUSTOM_OPENAI_EMBEDDING_MODEL ?? 'bge-m3';

  private getClient(): OpenAI {
    if (!this.client) {
      this.client = new OpenAI({
        apiKey: process.env.CUSTOM_OPENAI_API_KEY,
        baseURL: process.env.CUSTOM_OPENAI_API_BASE,
      });
    }
    return this.client;
  }

  async embed(text: string): Promise<number[]> {
    const res = await this.getClient().embeddings.create({
      model: this.model,
      input: text,
    });
    return res.data[0]!.embedding;
  }

  async embedMany(texts: string[]): Promise<number[][]> {
    const res = await this.getClient().embeddings.create({
      model: this.model,
      input: texts,
    });
    return res.data.map((d) => d.embedding);
  }
}
