import { describe, expect, test } from 'bun:test';
import { faqs as staticFaqs } from '@/content/faqs';
import { FAQ_SELECT, getFaqs, mapDbFaq, type FaqsDb } from './faqs-repo';

function fakeDb(result: { data: unknown[] | null; error: unknown | null }) {
  const calls: string[] = [];
  const db: FaqsDb = {
    from(table) {
      calls.push(`from:${table}`);
      return {
        select(columns) {
          calls.push(`select:${columns}`);
          return {
            order(column, options) {
              calls.push(`order:${column}:${String(options.ascending)}`);
              return Promise.resolve(result);
            },
          };
        },
      };
    },
  };
  return { db, calls };
}

describe('mapDbFaq', () => {
  test('maps English columns and falls back to Thai when nullable English is absent', () => {
    expect(
      mapDbFaq({
        question: 'คำถาม',
        answer: 'คำตอบ',
        question_en: null,
        answer_en: null,
      }),
    ).toEqual({
      question: 'คำถาม',
      answer: 'คำตอบ',
      questionEn: 'คำถาม',
      answerEn: 'คำตอบ',
    });
  });
});

describe('getFaqs', () => {
  test('uses the expected DB select/order and maps non-empty results', async () => {
    const { db, calls } = fakeDb({
      data: [{ question: 'Q', answer: 'A', question_en: 'Q EN', answer_en: 'A EN' }],
      error: null,
    });
    await expect(getFaqs(db)).resolves.toEqual([
      { question: 'Q', answer: 'A', questionEn: 'Q EN', answerEn: 'A EN' },
    ]);
    expect(FAQ_SELECT).toBe('question,answer,question_en,answer_en');
    expect(calls).toEqual([
      'from:faqs',
      'select:question,answer,question_en,answer_en',
      'order:sort_order:true',
    ]);
  });

  test('returns the static fallback for an empty result', async () => {
    const { db } = fakeDb({ data: [], error: null });
    await expect(getFaqs(db)).resolves.toEqual(staticFaqs);
  });
});
