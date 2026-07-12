import { describe, it, expect } from 'bun:test';
import {
  chunkProject,
  chunkService,
  chunkFaq,
  type Chunk,
} from '../src/ingestion/chunking';

describe('chunking (chunk-by-entity)', () => {
  it('splits a project into a summary chunk + a content chunk with metadata', () => {
    const chunks = chunkProject({
      id: 7,
      title: 'FinTrack',
      description: 'แดชบอร์ดจัดการการเงินสำหรับ startup',
      content: 'รายละเอียดเต็มของโปรเจกต์ '.repeat(60), // long
      category: 'SaaS',
      tags: ['dashboard', 'finance'],
      technologies: ['Next.js', 'Supabase'],
    });

    expect(chunks).toHaveLength(2);
    // chunk 0 = summary (title + description + taxonomy)
    expect(chunks[0]!.sourceType).toBe('project');
    expect(chunks[0]!.sourceId).toBe(7);
    expect(chunks[0]!.chunkIndex).toBe(0);
    expect(chunks[0]!.text).toContain('FinTrack');
    expect(chunks[0]!.text).toContain('แดชบอร์ด');
    expect(chunks[0]!.metadata).toMatchObject({
      category: 'SaaS',
      tags: ['dashboard', 'finance'],
      title: 'FinTrack',
    });
    // chunk 1 = content, bounded in length
    expect(chunks[1]!.chunkIndex).toBe(1);
    expect(chunks[1]!.text.length).toBeLessThanOrEqual(1000);
  });

  it('emits only the summary chunk when a project has no content', () => {
    const chunks = chunkProject({ id: 1, title: 'X', description: 'y' });
    expect(chunks).toHaveLength(1);
    expect(chunks[0]!.chunkIndex).toBe(0);
  });

  it('makes one chunk per service (title + audience + description)', () => {
    const chunks = chunkService({
      id: 1,
      title: 'SaaS Platform',
      targetAudience: 'startup',
      description: 'พัฒนา SaaS ครบวงจร',
    });
    expect(chunks).toHaveLength(1);
    expect(chunks[0]!.sourceType).toBe('service');
    expect(chunks[0]!.text).toContain('SaaS Platform');
    expect(chunks[0]!.text).toContain('พัฒนา SaaS');
  });

  it('makes one chunk per FAQ (question + answer)', () => {
    const chunks: Chunk[] = chunkFaq({
      id: 3,
      question: 'ราคาเท่าไหร่',
      answer: 'ขึ้นกับ scope',
      category: 'pricing',
    });
    expect(chunks).toHaveLength(1);
    expect(chunks[0]!.sourceType).toBe('faq');
    expect(chunks[0]!.text).toContain('ราคาเท่าไหร่');
    expect(chunks[0]!.text).toContain('ขึ้นกับ scope');
    expect(chunks[0]!.metadata.category).toBe('pricing');
  });
});
