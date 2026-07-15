"use client";

import { services, type Service } from "@/content/services";
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
      {/* Capability strip — the full range of deliverables at a glance, as
          grid-divided columns (the visible-grid rails become the layout). A
          different composition from the interactive Solution list above. */}
      <div className="srv-strip rv">
        {items.map((s) => (
          <div className="srv-col" key={s.no}>
            <span className="srv-col-no t-meta">{s.no}</span>
            <h3 className="srv-col-title">{s.title}</h3>
            <p className="srv-col-desc">
              {en ? s.descriptionEn : s.description}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}

/** Homepage services (Requirement §4.5), bilingual (§7.1). */
export function ServiceList() {
  const { locale } = useLocale();
  return <ServiceListView items={services} en={locale === "en"} />;
}
