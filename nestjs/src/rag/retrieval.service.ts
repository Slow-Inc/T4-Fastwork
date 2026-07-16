import type { RetrievedItem } from '../chat/system-prompt';

export const RETRIEVAL_SERVICE = Symbol('RETRIEVAL_SERVICE');

/** Fills the system prompt's context. Implemented by DrizzleRetrievalService (pgvector). */
export interface RetrievalService {
  retrieve(query: string, language: 'th' | 'en'): Promise<RetrievedItem[]>;
}
