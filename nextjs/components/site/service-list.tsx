"use client";

import type { Service } from "@/content/services";
import { useLocale } from "@/i18n/locale-context";

/** Presentational services list — pure, unit-testable. */
export function ServiceListView({
  items,
  en,
}: {
  items: Service[];
  en: boolean;
}) {
  return (
    <section id="services" className="section">
      <div className="srv-head rv">
        <div className="t-idx">03 — Services</div>
        <h2>From one page to a whole platform.</h2>
      </div>
      <div className="rv">
        {items.map((s) => (
          <div className="srv-row" key={s.no}>
            <span className="t-meta">{s.no}</span>
            <span className="sn">{s.title}</span>
            <span className="sd">{en ? s.descriptionEn : s.description}</span>
          </div>
        ))}
      </div>
    </section>
  );
}

/** Homepage services (Requirement §4.5), bilingual (§7.1). */
export function ServiceList({ items }: { items: Service[] }) {
  const { locale } = useLocale();
  return <ServiceListView items={items} en={locale === "en"} />;
}
