/**
 * Kinetic marquee — the giant display headline that scrolls behind the 3D form
 * (the "Text แบบใหญ่ด้านหลัง 3D Model" from the ChainGPT labs hero). Two identical
 * copies so the CSS translateX(-50%) loop is seamless. Purely decorative (the real
 * semantic <h1> lives in the hero copy), so the whole band is aria-hidden.
 */
export function KineticMarquee({ text }: { text: string }) {
  return (
    <div className="kinetic-marquee" aria-hidden="true">
      <div className="kinetic-marquee-track">
        <span className="kinetic-marquee-item">{text}</span>
        <span className="kinetic-marquee-item">{text}</span>
      </div>
    </div>
  );
}
