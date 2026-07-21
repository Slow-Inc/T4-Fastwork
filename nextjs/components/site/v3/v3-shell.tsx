import { SiteNav } from '@/components/site/site-nav';
import { SiteFooter } from '@/components/site/site-footer';
import { ChatButton } from '@/components/site/chat-button';
import { RevealObserver } from '@/components/site/reveal-observer';
import { SmoothScroll } from '@/components/site/smooth-scroll';
import { Lab4Fx } from '@/components/site/lab4/lab4-fx';
import { Lab4ThemeToggle } from '@/components/site/lab4/lab4-theme-toggle';
import { BotToggle } from '@/components/site/v3/bot-toggle';
import { FootBot } from '@/components/site/v3/foot-bot';
import { FootLegal } from '@/components/site/v3/foot-legal';

/**
 * The v3 page shell (requirement3 §14) — extracted from the home so every page
 * gets the same chrome without copy-pasting a hydration-sensitive inline script
 * 13 times. It owns: the themed `.lab4` root, the pre-paint theme init, the
 * blueprint field, the nav + theme switch, the oversized-wordmark footer band
 * with the robot peeking over it, the site footer, and the global observers.
 *
 * Pages supply their own `<main>` (usually `.lab4-shell`) as children.
 */

// runs synchronously while the .lab4 div is parsed, so the first paint is
// already in the right theme; the attribute lives on the div (not <html>)
// and the div suppresses the expected server/client attribute difference
// Resolution order: a saved choice always wins, then the page's own
// data-default-theme ('light'|'dark' pins it; 'system'/absent = OS preference).
// Home pins 'light' so it opens as the warm earth-tone Swiss surface (the
// "Swiss Calm Thesis" direction) rather than the dramatic dark.
export const THEME_INIT = `(function(){var el=document.currentScript.closest('.lab4');var t,b;try{t=localStorage.getItem('lab4-theme');b=localStorage.getItem('lab4-bot')}catch(e){}if(t!=='light'&&t!=='dark'){var d=el.getAttribute('data-default-theme')||'system';t=(d==='light'||d==='dark')?d:(matchMedia('(prefers-color-scheme: light)').matches?'light':'dark')}el.dataset.lab4Theme=t;el.dataset.lab4Bot=b==='off'?'off':'on'})()`;

/** §14.5: how loud the blueprint grid is — a real per-page decision. */
export type Blueprint = 'visible' | 'quiet' | 'invisible';

/**
 * §14.10 caps the live WebGL stage at Home. Everywhere else the character is
 * present as a ~15 KB static render, which is what makes "อยู่ทุกที่" affordable.
 */
export type ShellRobot = 'live' | 'static' | 'none';

export function V3Shell({
  blueprint = 'quiet',
  robot = 'static',
  children,
  chat = true,
  siteFooter = true,
  defaultTheme = 'system',
}: {
  blueprint?: Blueprint;
  robot?: ShellRobot;
  children: React.ReactNode;
  /** /chat suppresses the floating panel — it IS the chat. */
  chat?: boolean;
  /** First-visit theme when nothing is saved: 'light'|'dark' pins it,
   *  'system' follows the OS. Home pins 'light' (Swiss Calm Thesis). */
  defaultTheme?: 'light' | 'dark' | 'system';
  /**
   * The home IS the /lab4 composition "ห้ามแก้อะไรทั้งนั้น" — its only footer is
   * the §14.10 oversized wordmark band (rendered above). The prototype never had
   * the production menu/legal `<SiteFooter>`; content pages that need a real
   * sitemap keep it (default), the home opts out to stay identical to lab4.
   */
  siteFooter?: boolean;
}) {
  return (
    <div className="lab4" data-default-theme={defaultTheme} suppressHydrationWarning>
      <script dangerouslySetInnerHTML={{ __html: THEME_INIT }} />

      {blueprint !== 'invisible' && (
        <div className="lab4-field" data-blueprint={blueprint} aria-hidden />
      )}

      {/* fix1 Accessibility: first tab stop, so keyboard users can jump the nav */}
      <a className="v3-skip" href="#main">
        ข้ามไปเนื้อหาหลัก
      </a>

      <SiteNav />
      <div className="lab4-theme-float">
        <Lab4ThemeToggle />
        <BotToggle />
      </div>

      {children}

      {/* Oversized brand wordmark (§14.10) — the one place the robot appears on
          every page, which is what delivers presence without a second canvas.
          Home overrides this with its live zone-5 marker instead. */}
      <div className="lab4-footer">
        <div className="lab4-shell">
          <div className="lab4-wordmark-wrap">
            <div className="lab4-wordmark" aria-hidden>
              T4 LABS
            </div>
            {robot === 'live' ? (
              <div
                className="lab4-foot-dock"
                data-l4-zone="footer"
                data-l4-scale="0.9"
                data-l4-yaw="0.25"
                data-l4-pitch="0.18"
                aria-hidden
              />
            ) : robot === 'static' ? (
              <FootBot />
            ) : null}
          </div>
        </div>
      </div>
      {/* content pages get the full sitemap footer; the home/lab4 keeps only a
          slim legal strip under the wordmark (no repeated nav menu) */}
      {siteFooter ? <SiteFooter /> : <FootLegal />}

      {chat && <ChatButton />}
      {/* two reveal systems, deliberately: `data-rv` is the v3 language
          (Lab4Fx), `.rv` is the req1 one still used by embedded sections.
          A v3 page that forgot Lab4Fx renders its headings at opacity 0 —
          which is exactly how /privacy shipped invisible, so the shell owns
          both rather than leaving it to each page. */}
      <Lab4Fx />
      <RevealObserver />
      <SmoothScroll />
    </div>
  );
}
