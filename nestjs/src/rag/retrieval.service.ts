import { Injectable } from '@nestjs/common';
import type { RetrievedItem } from '../chat/system-prompt';

export const RETRIEVAL_SERVICE = Symbol('RETRIEVAL_SERVICE');

/** Fills the system prompt's context. Real pgvector impl lands in #8. */
export interface RetrievalService {
  retrieve(query: string, language: 'th' | 'en'): Promise<RetrievedItem[]>;
}

/**
 * Placeholder until #8 wires real pgvector retrieval (which also needs the DB
 * pooler password + bge-m3 embeddings #14). Returns a small fixed sample so the
 * chat pipeline is demonstrable end-to-end. Swap `useClass` in ChatModule.
 */
@Injectable()
export class StubRetrievalService implements RetrievalService {
  async retrieve(): Promise<RetrievedItem[]> {
    return [
      {
        kind: 'project',
        ref: 'fin-track',
        title: 'FinTrack',
        summary: 'SaaS dashboard การเงินสำหรับ startup',
      },
      {
        kind: 'service',
        ref: '1',
        title: 'SaaS Platform',
        summary: 'พัฒนา SaaS Platform ครบวงจร',
      },
    ];
  }
}
