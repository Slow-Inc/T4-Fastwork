import type { Faq } from '@/content/faqs';

/** Accessible FAQ accordion using native <details> (Requirement §4.6). */
export function FaqAccordion({ items }: { items: Faq[] }) {
  return (
    <div className="faq-list rv">
      {items.map((f) => (
        <details key={f.question} className="faq-item">
          <summary className="faq-q">
            <span>{f.question}</span>
            <span className="faq-mark" aria-hidden="true">
              +
            </span>
          </summary>
          <p className="faq-a">{f.answer}</p>
        </details>
      ))}
    </div>
  );
}
