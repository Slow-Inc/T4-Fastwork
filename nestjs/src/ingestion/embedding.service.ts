import { Injectable } from '@nestjs/common';
import OpenAI from 'openai';

/**
 * OpenAI-compatible embeddings. Uses a SEPARATE endpoint from chat so the
 * embedding provider can differ (chat = 9arm gateway; embeddings = Jina v3,
 * `jina-embeddings-v3`, 1024-dim, hosted — serverless-friendly). Falls back to
 * the chat endpoint's base/key if the embedding-specific ones aren't set.
 * Lazy client so module boot doesn't require the key.
 */
@Injectable()
export class EmbeddingService {
  private client?: OpenAI;
  private readonly model =
    process.env.CUSTOM_OPENAI_EMBEDDING_MODEL ?? 'jina-embeddings-v3';

  private getClient(): OpenAI {
    if (!this.client) {
      this.client = new OpenAI({
        apiKey:
          process.env.CUSTOM_OPENAI_EMBEDDING_API_KEY ??
          process.env.CUSTOM_OPENAI_API_KEY,
        baseURL:
          process.env.CUSTOM_OPENAI_EMBEDDING_API_BASE ??
          process.env.CUSTOM_OPENAI_API_BASE,
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
