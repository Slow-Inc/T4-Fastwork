import { test, expect, type Page } from "@playwright/test";

/**
 * Real-browser checks for the `/lab4` prototype (requirement3.md §14 v3):
 * dual dark/light theme with a pre-paint init + nav toggle, the T4 Bot
 * travel stage (or graceful absence), the solution index, the request-path
 * schematic whose AI node opens the live /chat, the services ladder and the
 * oversized-wordmark footer — with no console errors.
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

test("/lab4: hero renders on the dark canvas for dark-scheme users without errors", async ({
  page,
}) => {
  const errors = trackErrors(page);
  await page.emulateMedia({ colorScheme: "dark" });
  await page.goto("/lab4", { waitUntil: "networkidle" });

  // dark labs-grade token set applies for prefers-color-scheme: dark (§14.7)
  await expect(page.locator(".lab4")).toHaveCSS(
    "background-color",
    "rgb(8, 10, 12)",
    { timeout: 10_000 },
  );

  await expect(page.locator("h1")).toHaveCount(1);
  await expect(page.locator("h1")).toBeVisible();

  // kinetic marquee band scrolls behind the robot (/lab v1 motif)
  await expect(page.locator(".lab4-marquee .kinetic-marquee-track")).toBeVisible();

  // glass nav with CTA + theme switch
  await expect(page.locator(".lab4-nav")).toBeVisible();
  await expect(page.locator(".lab4-nav-cta")).toBeVisible();
  await expect(page.locator(".lab4-theme-btn")).toBeVisible();

  expect(errors, "console errors on /lab4").toEqual([]);
});

test("/lab4: theme toggle flips to light labs-grade and persists (§14.7)", async ({
  page,
}) => {
  const errors = trackErrors(page);
  await page.emulateMedia({ colorScheme: "dark" });
  await page.goto("/lab4", { waitUntil: "networkidle" });

  await page.locator(".lab4-theme-btn").click();
  await expect(page.locator(".lab4")).toHaveAttribute("data-lab4-theme", "light");
  await expect
    .poll(async () =>
      page.locator(".lab4").evaluate((el) => getComputedStyle(el).backgroundColor),
    )
    .toBe("rgb(244, 242, 237)");

  // persisted choice wins over the (dark) system scheme on reload
  await page.reload({ waitUntil: "networkidle" });
  await expect(page.locator(".lab4")).toHaveAttribute("data-lab4-theme", "light");

  expect(errors, "console errors while switching theme").toEqual([]);
});

test("/lab4 long page: sections, /chat door in the schematic, wordmark footer", async ({
  page,
}) => {
  const errors = trackErrors(page);
  await page.goto("/lab4", { waitUntil: "networkidle" });

  await expect(page.locator("a.lab4-sol")).toHaveCount(6);
  await expect(page.locator(".lab4-sol.wide")).toHaveCount(3);
  await expect(page.locator(".lab4-sol.narrow")).toHaveCount(3);

  // the real request path: 5 nodes, and the AI node is a live link to /chat
  await expect(page.locator(".lab4-node")).toHaveCount(5);
  await expect(page.locator('a.lab4-node[href="/chat"]')).toHaveCount(1);
  await expect(page.locator(".lab4-step")).toHaveCount(5);
  await expect(page.locator(".lab4-svc")).toHaveCount(6);

  // oversized wordmark footer with the robot dock zone marker
  await expect(page.locator(".lab4-wordmark")).toHaveText("T4 LABS");
  await expect(page.locator('.lab4-foot-dock[data-l4-zone="footer"]')).toHaveCount(1);

  // three storytelling zone markers total (§14.2.1 — 3–4 zones max)
  await expect(page.locator("[data-l4-zone]")).toHaveCount(3);

  expect(errors, "console errors on /lab4 long page").toEqual([]);
});

test("/lab4: reveal transition ships its reduced-motion neutralisation in the CSS", async ({
  page,
}) => {
  await page.goto("/lab4", { waitUntil: "networkidle" });
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
          r.selectorText === ".lab4 [data-rv]" &&
          r.style.opacity === "0"
        ) {
          baseHides = true;
        }
        if (r instanceof CSSMediaRule && /prefers-reduced-motion/.test(r.conditionText)) {
          for (const inner of Array.from(r.cssRules)) {
            if (
              inner instanceof CSSStyleRule &&
              inner.selectorText === ".lab4 [data-rv]" &&
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
  expect(css.baseHides, ".lab4 [data-rv] should start hidden for the reveal").toBe(true);
  expect(css.reduceShows, "reduced-motion must force [data-rv] fully visible").toBe(true);
});
