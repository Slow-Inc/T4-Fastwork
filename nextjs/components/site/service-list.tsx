"use client";

import { useRef, useState } from "react";
import { services, type Service } from "@/content/services";
import { useLocale } from "@/i18n/locale-context";

/** Presentational services list — pure-ish (the flair is local state). */
export function ServiceListView({
  items,
  en,
}: {
  items: Service[];
  en: boolean;
}) {
  const stripRef = useRef<HTMLDivElement>(null);
  // Magnetic accent marker: tracks the hovered column along the bottom rail.
  const [marker, setMarker] = useState<{ x: number; w: number } | null>(null);

  function trackColumn(col: HTMLElement) {
    const strip = stripRef.current;
    if (!strip) return;
    const c = col.getBoundingClientRect();
    const s = strip.getBoundingClientRect();
    setMarker({ x: c.left - s.left, w: c.width });
  }

  return (
    <section id="services" className="section">
      <div className="srv-head rv">
        <div className="t-idx">03 — Services</div>
        <h2>From one page to a whole platform.</h2>
      </div>
      {/* Capability strip — grid-divided columns whose hairline rails draw in on
          reveal, react on hover, and are tracked by a magnetic accent marker. */}
      <div
        className="srv-strip rv"
        ref={stripRef}
        onMouseLeave={() => setMarker(null)}
      >
        {items.map((s) => (
          <div
            className="srv-col"
            key={s.no}
            onMouseEnter={(e) => trackColumn(e.currentTarget)}
          >
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
        <span
          className="srv-marker"
          aria-hidden="true"
          style={
            marker
              ? {
                  transform: `translateX(${marker.x}px)`,
                  width: `${marker.w}px`,
                  opacity: 1,
                }
              : undefined
          }
        />
      </div>
    </section>
  );
}

/** Homepage services (Requirement §4.5), bilingual (§7.1). */
export function ServiceList() {
  const { locale } = useLocale();
  return <ServiceListView items={services} en={locale === "en"} />;
}
