"use client";

import { services, type Service } from "@/content/services";
import { useLocale } from "@/i18n/locale-context";

/** Presentational services list — pure (the flair is CSS-only). */
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
      {/* Capability strip — grid-divided columns whose hairline rails draw in on
          reveal, react on hover, and are tracked by a magnetic accent marker
          (positioned via :has(), no JS). */}
      <div className="srv-strip rv">
        {items.map((s) => (
          <div className="srv-col" key={s.no}>
            <span className="srv-plus" aria-hidden="true">
              +
            </span>
            <span className="srv-col-no t-meta">{s.no}</span>
            <h3 className="srv-col-title">{s.title}</h3>
            <p className="srv-col-desc">
              {en ? s.descriptionEn : s.description}
            </p>
          </div>
        ))}
        <span className="srv-marker" aria-hidden="true" />
      </div>
    </section>
  );
}

/** Homepage services (Requirement §4.5), bilingual (§7.1). */
export function ServiceList() {
  const { locale } = useLocale();
  return <ServiceListView items={services} en={locale === "en"} />;
}
