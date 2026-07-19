import { test, expect, type Page } from "@playwright/test";

/**
 * Real-browser checks for the `/lab3` prototype (requirement2.md §14 —
 * Layered Immersive Swiss System): dark void canvas, glass nav, the Meshy
 * Product Reactor scene (or its CSS fallback), the solution index, the real
 * request-path schematic, and the services ladder — with no console errors.
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

test("/lab3: hero thesis + reactor scene render on the void canvas without errors", async ({
  page,
}) => {
  const errors = trackErrors(page);
  await page.goto("/lab3", { waitUntil: "networkidle" });

  // Dark immersive canvas (§14.7 `void` token) actually applied.
  const bg = await page
    .locator(".lab3")
    .evaluate((el) => getComputedStyle(el).backgroundColor);
  expect(bg).toBe("rgb(8, 10, 12)");

  // One semantic h1, visible (critical copy renders before/without 3D).
  await expect(page.locator("h1")).toHaveCount(1);
  await expect(page.locator("h1")).toBeVisible();

  // The reactor mounts as WebGL, or degrades to the CSS fallback poster.
  await expect(
    page.locator(".lab3-scene canvas, .lab3-scene-fallback").first(),
  ).toBeVisible();

  // Glass nav present with its CTA.
  await expect(page.locator(".lab3-nav")).toBeVisible();
  await expect(page.locator(".lab3-nav-cta")).toBeVisible();

  expect(errors, "console errors on /lab3").toEqual([]);
});

test("/lab3 long page: solution index, schematic, services ladder + footer order", async ({
  page,
}) => {
  const errors = trackErrors(page);
  await page.goto("/lab3", { waitUntil: "networkidle" });

  // Six solution rows linking to /recommend/[type], mixed spans (3 wide + 3 narrow).
  await expect(page.locator("a.lab3-sol")).toHaveCount(6);
  await expect(page.locator(".lab3-sol.wide")).toHaveCount(3);
  await expect(page.locator(".lab3-sol.narrow")).toHaveCount(3);
  await expect(page.locator('a[href="/recommend/saas"]')).toHaveCount(1);

  // The real request path: 5 stack nodes + 5 process steps.
  await expect(page.locator(".lab3-node")).toHaveCount(5);
  await expect(page.locator(".lab3-step")).toHaveCount(5);

  // Services ladder: 6 rungs with complexity meters.
  await expect(page.locator(".lab3-svc")).toHaveCount(6);
  await expect(page.locator(".lab3-svc .meter i")).toHaveCount(6);

  // Footer wordmark sits well below the fixed nav.
  const nav = await page.locator(".lab3-nav").boundingBox();
  const footer = await page.locator("footer.lab3-footer").boundingBox();
  expect(nav).not.toBeNull();
  expect(footer).not.toBeNull();
  expect(footer!.y).toBeGreaterThan(nav!.y + nav!.height + 200);

  expect(errors, "console errors on /lab3 long page").toEqual([]);
});

test("/lab3: reveal transition ships its reduced-motion neutralisation in the CSS", async ({
  page,
}) => {
  await page.goto("/lab3", { waitUntil: "networkidle" });
  const css = await page.evaluate(() => {
    let baseHides = false;
    let reduceShows = false;
    for (const sheet of Array.from(document.styleSheets)) {
      let rules: CSSRuleList;
      try {
        rules = sheet.cssRules;
      } catch {
        continue; // cross-origin
      }
      for (const r of Array.from(rules)) {
        if (
          r instanceof CSSStyleRule &&
          r.selectorText === ".lab3 [data-rv]" &&
          r.style.opacity === "0"
        ) {
          baseHides = true;
        }
        if (
          r instanceof CSSMediaRule &&
          /prefers-reduced-motion/.test(r.conditionText)
        ) {
          for (const inner of Array.from(r.cssRules)) {
            if (
              inner instanceof CSSStyleRule &&
              inner.selectorText === ".lab3 [data-rv]" &&
              inner.style.opacity === "1"
            ) {
              reduceShows = true;
            }
          }
        }
      }
    }
    return { baseHides, reduceShows };
  });
  expect(css.baseHides, ".lab3 [data-rv] should start hidden for the reveal").toBe(true);
  expect(
    css.reduceShows,
    "reduced-motion must force [data-rv] fully visible",
  ).toBe(true);
});
