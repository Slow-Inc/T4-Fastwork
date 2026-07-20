import { Lab4Home } from '@/components/site/lab4/lab4-home';

/**
 * Live home = the /lab4 composition rendered UNCHANGED (dev directive
 * 2026-07-20: "เอา lab4 เป็นหน้า home แบบห้ามแก้อะไรทั้งนั้น"). Both routes render
 * the same `Lab4Home`, so the home and the prototype are identical by
 * construction rather than by parity tests. SEO metadata comes from the root
 * layout. The previous product home (SiteNav + SDLC/Team/work rows) is kept
 * verbatim at /legacy-2.
 */
export default function Home() {
  return <Lab4Home />;
}
