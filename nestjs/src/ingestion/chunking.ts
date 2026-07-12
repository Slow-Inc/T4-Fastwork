/**
 * Chunk-by-entity for the RAG pipeline (#7). Each portfolio entity becomes
 * 1-2 chunks — a retrieval-friendly summary plus (for projects) a bounded slice
 * of the long-form content. Metadata rides along for filtering + to rebuild a
 * `RetrievedItem` at query time. Pure + framework-agnostic; the ingestion
 * service maps DB rows to these inputs and embeds each chunk's `text`.
 */

export interface ChunkMetadata {
  title?: string;
  category?: string;
  tags?: string[];
}

export interface Chunk {
  sourceType: 'project' | 'service' | 'faq';
  sourceId: number;
  chunkIndex: number;
  text: string;
  metadata: ChunkMetadata;
}

export interface ProjectInput {
  id: number;
  title: string;
  titleEn?: string;
  description?: string;
  content?: string;
  category?: string;
  tags?: string[];
  technologies?: string[];
}

export interface ServiceInput {
  id: number;
  title: string;
  targetAudience?: string;
  description?: string;
}

export interface FaqInput {
  id: number;
  question: string;
  answer: string;
  category?: string;
}

const CONTENT_MAX = 1000; // keep content chunks small — retrieval, not storage

function joinLines(parts: (string | undefined)[]): string {
  return parts.filter((p): p is string => !!p && p.trim().length > 0).join('\n');
}

export function chunkProject(p: ProjectInput): Chunk[] {
  const metadata: ChunkMetadata = {
    title: p.title,
    category: p.category,
    tags: p.tags,
  };

  const summary = joinLines([
    p.title,
    p.titleEn && p.titleEn !== p.title ? p.titleEn : undefined,
    p.description,
    p.category ? `หมวดหมู่: ${p.category}` : undefined,
    p.tags?.length ? `แท็ก: ${p.tags.join(', ')}` : undefined,
    p.technologies?.length ? `เทคโนโลยี: ${p.technologies.join(', ')}` : undefined,
  ]);

  const chunks: Chunk[] = [
    { sourceType: 'project', sourceId: p.id, chunkIndex: 0, text: summary, metadata },
  ];

  const content = p.content?.trim();
  if (content) {
    chunks.push({
      sourceType: 'project',
      sourceId: p.id,
      chunkIndex: 1,
      text: content.slice(0, CONTENT_MAX),
      metadata,
    });
  }
  return chunks;
}

export function chunkService(s: ServiceInput): Chunk[] {
  return [
    {
      sourceType: 'service',
      sourceId: s.id,
      chunkIndex: 0,
      text: joinLines([
        s.title,
        s.targetAudience ? `กลุ่มเป้าหมาย: ${s.targetAudience}` : undefined,
        s.description,
      ]),
      metadata: { title: s.title },
    },
  ];
}

export function chunkFaq(f: FaqInput): Chunk[] {
  return [
    {
      sourceType: 'faq',
      sourceId: f.id,
      chunkIndex: 0,
      text: joinLines([f.question, f.answer]),
      metadata: { title: f.question, category: f.category },
    },
  ];
}
