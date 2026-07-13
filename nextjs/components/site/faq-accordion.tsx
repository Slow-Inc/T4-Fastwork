import { staggerDelay } from '@/lib/stagger';

interface FaqItem {
  question: string;
  answer: string;
  questionEn?: string;
  answerEn?: string;
}

/** Accessible FAQ accordion using native <details> (Requirement §4.6), bilingual. */
export function FaqAccordion({ items, en = false }: { items: FaqItem[]; en?: boolean }) {
  return (
    <div className="faq-list">
      {items.map((f, i) => (
        <details
          key={f.question}
          className="faq-item rv rv-down"
          style={{ transitionDelay: staggerDelay(i) }}
        >
          <summary className="faq-q">
            <span>{en && f.questionEn ? f.questionEn : f.question}</span>
            <span className="faq-mark" aria-hidden="true">
              +
            </span>
          </summary>
          <p className="faq-a">
            <span>{en && f.answerEn ? f.answerEn : f.answer}</span>
          </p>
        </details>
      ))}
    </div>
  );
}
