import 'server-only';
import { publicDb } from '@/lib/public-db';
import { faqs as staticFaqs, type Faq } from '@/content/faqs';

export interface DbFaqRow {
  question: string;
  answer: string;
  question_en: string | null;
  answer_en: string | null;
}

export interface FaqsDb {
  from(table: 'faqs'): {
    select(columns: string): {
      order(column: 'sort_order', options: { ascending: boolean }): Promise<{
        data: unknown[] | null;
        error: unknown | null;
      }>;
    };
  };
}

export const FAQ_SELECT = 'question,answer,question_en,answer_en';

export function mapDbFaq(row: DbFaqRow): Faq {
  return {
    question: row.question,
    answer: row.answer,
    questionEn: row.question_en ?? row.question,
    answerEn: row.answer_en ?? row.answer,
  };
}

export async function getFaqs(db: FaqsDb = publicDb() as unknown as FaqsDb): Promise<Faq[]> {
  try {
    const { data, error } = await db.from('faqs').select(FAQ_SELECT).order('sort_order', {
      ascending: true,
    });
    if (error || !data || data.length === 0) return staticFaqs;
    return (data as DbFaqRow[]).map(mapDbFaq);
  } catch {
    return staticFaqs;
  }
}
