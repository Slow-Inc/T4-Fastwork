import { test, expect, type Page } from "@playwright/test";

/**
 * Real-browser checks for the `/lab` hero prototype (ChainGPT teardown → T4):
 * the intro preloader plays then unmounts, and the kinetic marquee + cursor-
 * reactive 3D + blueprint grid all render with no hydration/console errors.
 *
 * Motion assertions go through the CSSOM (does the built stylesheet ship the
 * animation + its reduced-motion freeze), not computed style — this runner does
 * not reliably emulate `prefers-reduced-motion`, so a computed-style check would
 * be environment-dependent. The CSSOM proves the authored contract shipped.
 */
function trackErrors(page: Page): string[] {
  const errors: string[] = [];
  page.on("console", (m) => {
    if (m.type() !== "error") return;
    const text = m.text();
    if (/Failed to load resource/i.test(text)) {
      const url = m.location()?.url ?? "";
      try {
        if (url && new URL(url).origin !== new URL(page.url()).origin) return;
      } catch {
        /* unknown origin → treat as first-party */
      }
    }
    errors.push(text);
  });
  page.on("pageerror", (e) => errors.push(e.message));
  return errors;
}

test("/lab: preloader → marquee + 3D + grid assemble without errors", async ({
  page,
}) => {
  const errors = trackErrors(page);
  await page.goto("/lab", { waitUntil: "networkidle" });

  // The intro preloader is gone once it finishes (played then wiped, or skipped
  // under reduced motion) — either way it must not linger and trap the page.
  await expect(page.locator(".lab-preloader")).toHaveCount(0, { timeout: 6000 });

  // A single visible semantic <h1> (the marquee itself is decorative/aria-hidden).
  await expect(page.locator("h1")).toHaveCount(1);
  await expect(page.locator("h1")).toBeVisible();

  // Kinetic marquee: the display text is duplicated for a seamless loop.
  await expect(page.locator(".kinetic-marquee-item")).toHaveCount(2);

  // Blueprint framing: four corner registration marks.
  await expect(page.locator(".bp-corner")).toHaveCount(4);

  // The 3D form mounts as a WebGL canvas, or degrades to the CSS fallback orb.
  await expect(
    page.locator(".lab-hero-scene canvas, .lab-hero-scene-fallback").first(),
  ).toBeVisible();

  // Site nav exists (page composes the real shell).
  expect(await page.locator("nav").first().boundingBox()).not.toBeNull();

  expect(errors, "console errors on /lab").toEqual([]);
});

test("/lab long page: every section renders and the footer sits below the nav", async ({
  page,
}) => {
  const errors = trackErrors(page);
  await page.goto("/lab", { waitUntil: "networkidle" });
  await expect(page.locator(".lab-preloader")).toHaveCount(0, { timeout: 6000 });

  // Sections down the long page.
  await expect(page.locator(".lab-cap-cell")).toHaveCount(6);
  await expect(page.locator(".lab-flow-node")).toHaveCount(5);
  await expect(page.locator(".lab-work-cell").first()).toBeVisible();
  await expect(page.locator(".lab-stat")).toHaveCount(4);
  await expect(page.locator(".faq-item").first()).toBeVisible();
  await expect(page.locator(".lab-drench")).toBeVisible();
  await expect(page.locator(".lab-wordmark")).toBeVisible();

  // Still a single semantic h1 (section titles are h2/h3) inside one <main>.
  await expect(page.locator("h1")).toHaveCount(1);
  await expect(page.locator("main")).toHaveCount(1);

  // The footer must sit well below the fixed navbar (no overlap / collapse).
  const nav = await page.locator("nav").first().boundingBox();
  const footer = await page.locator("footer.lab-footer").boundingBox();
  expect(nav).not.toBeNull();
  expect(footer).not.toBeNull();
  expect(footer!.y).toBeGreaterThan(nav!.y + nav!.height + 200);

  expect(errors, "console errors on /lab long page").toEqual([]);
});

test("/lab: marquee animation + its reduced-motion freeze both shipped in the CSS", async ({
  page,
}) => {
  await page.goto("/lab", { waitUntil: "networkidle" });
  const css = await page.evaluate(() => {
    let hasKeyframes = false;
    let baseUsesIt = false;
    let reduceFreezes = false;
    const usesLabMarquee = (s: CSSStyleDeclaration) =>
      /lab-marquee/.test(s.animation + s.animationName);
    for (const sheet of Array.from(document.styleSheets)) {
      let rules: CSSRuleList;
      try {
        rules = sheet.cssRules;
      } catch {
        continue; // cross-origin
      }
      for (const r of Array.from(rules)) {
        if (r instanceof CSSKeyframesRule && r.name === "lab-marquee") {
          hasKeyframes = true;
        }
        if (
          r instanceof CSSStyleRule &&
          r.selectorText === ".kinetic-marquee-track" &&
          usesLabMarquee(r.style)
        ) {
          baseUsesIt = true;
        }
        // reduced-motion media block that freezes the marquee's animation.
        if (
          r instanceof CSSMediaRule &&
          /prefers-reduced-motion/.test(r.conditionText) &&
          /reduce/.test(r.conditionText)
        ) {
          for (const inner of Array.from(r.cssRules)) {
            if (
              inner instanceof CSSStyleRule &&
              /kinetic-marquee-track/.test(inner.selectorText) &&
              /(^|[\s:])none/.test(
                inner.style.animation + " " + inner.style.animationName,
              )
            ) {
              reduceFreezes = true;
            }
          }
        }
      }
    }
    return { hasKeyframes, baseUsesIt, reduceFreezes };
  });
  expect(css.hasKeyframes, "@keyframes lab-marquee missing").toBe(true);
  expect(
    css.baseUsesIt,
    ".kinetic-marquee-track should run the lab-marquee animation",
  ).toBe(true);
  expect(
    css.reduceFreezes,
    "reduced-motion should freeze the marquee (animation:none)",
  ).toBe(true);
});
