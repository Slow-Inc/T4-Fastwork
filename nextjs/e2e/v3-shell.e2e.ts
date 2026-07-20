import { test, expect, type Page } from "@playwright/test";

/**
 * The v3 shell contract (requirement3 §14), issue #110.
 *
 * Every page migrated onto `V3Shell` must satisfy this suite. Add the route to
 * `V3_PAGES` as each tier lands — that list IS the migration progress bar.
 *
 * The opacity assertion is not paranoia: `/privacy` and `/terms` shipped for
 * months rendering their entire body at `opacity: 0` (they used `.rv` without
 * mounting `RevealObserver`), and the smoke suite never caught it because
 * Playwright's `toBeVisible()` ignores opacity. Every page here is checked for
 * actually-painted content, not merely present-in-the-DOM content.
 */

/** Routes migrated onto V3Shell, with the §14.5 blueprint level each declares. */
const V3_PAGES: { path: string; blueprint: "visible" | "quiet" | "invisible" }[] =
  [
    { path: "/privacy", blueprint: "invisible" },
    { path: "/terms", blueprint: "invisible" },
    { path: "/bw", blueprint: "quiet" },
  ];

/** The reveal system must have actually run — not just rendered the markup. */
async function expectPainted(page: Page, selector: string) {
  const el = page.locator(selector).first();
  await expect(el).toBeVisible();
  await expect
    .poll(
      () => el.evaluate((n) => Number(getComputedStyle(n).opacity)),
      { message: `${selector} is in the DOM but painted transparent` },
    )
    .toBeGreaterThan(0.9);
}

for (const { path, blueprint } of V3_PAGES) {
  test(`v3 shell contract: ${path}`, async ({ page }) => {
    const errors: string[] = [];
    page.on("console", (m) => m.type() === "error" && errors.push(m.text()));
    await page.goto(path, { waitUntil: "networkidle" });

    // themed root with the pre-paint attribute resolved
    const shell = page.locator(".lab4");
    await expect(shell).toHaveAttribute("data-lab4-theme", /^(light|dark)$/);

    // the page's content is actually painted (see the /privacy bug above)
    await expectPainted(page, "h1");

    // §14.5 — blueprint loudness is a declared per-page decision
    const field = page.locator(".lab4-field");
    if (blueprint === "invisible") {
      await expect(field).toHaveCount(0);
    } else {
      await expect(field).toHaveAttribute("data-blueprint", blueprint);
    }

    // §14.10 / annoyance rule 2 — never two robots in one viewport
    const bots = await page
      .locator(".v3-foot-bot, .lab4-foot-dock, .lab4-stagefx")
      .count();
    expect(bots, "more than one robot instance on the page").toBeLessThanOrEqual(
      1,
    );

    expect(errors, `console errors on ${path}`).toEqual([]);
  });
}

// The dual-theme switch is part of the shell, so it works on every migrated
// page — not just the home where it was built.
test("the theme switch flips and persists from any v3 page", async ({ page }) => {
  await page.emulateMedia({ colorScheme: "dark" });
  await page.goto(V3_PAGES[0].path, { waitUntil: "networkidle" });

  await expect(page.locator(".lab4")).toHaveAttribute("data-lab4-theme", "dark");
  await page.locator(".lab4-theme-btn").click();
  await expect(page.locator(".lab4")).toHaveAttribute("data-lab4-theme", "light");
  expect(await page.evaluate(() => localStorage.getItem("lab4-theme"))).toBe(
    "light",
  );

  // and the choice survives a navigation to another v3 page
  await page.goto(V3_PAGES[1].path, { waitUntil: "networkidle" });
  await expect(page.locator(".lab4")).toHaveAttribute("data-lab4-theme", "light");
});

// Annoyance rule 5: an off switch is what makes a mascot feel respectful rather
// than imposed. It sits beside the theme toggle and persists.
test("the robot can be hidden, and the choice persists across pages", async ({
  page,
}) => {
  await page.goto("/", { waitUntil: "networkidle" });

  const bot = page.locator(".lab4-stagefx");
  await expect(bot).toHaveCount(1);

  await page.locator(".lab4-bot-btn").click();
  await expect(page.locator(".lab4")).toHaveAttribute("data-lab4-bot", "off");
  await expect(bot).toHaveCount(0);
  expect(await page.evaluate(() => localStorage.getItem("lab4-bot"))).toBe("off");

  // a static-robot page honours it too
  await page.goto("/bw", { waitUntil: "networkidle" });
  await expect(page.locator(".v3-foot-bot")).toHaveCount(0);

  // and it can be turned back on
  await page.locator(".lab4-bot-btn").click();
  await expect(page.locator(".v3-foot-bot")).toHaveCount(1);
});

// §14: the 404 is the best mascot moment on any site — and the page users
// actually hit. It must be a designed surface, not a framework default.
test("the 404 page is a designed v3 surface with the shrugging robot", async ({
  page,
}) => {
  const res = await page.goto("/this-route-does-not-exist", {
    waitUntil: "networkidle",
  });
  expect(res?.status()).toBe(404);

  await expect(page.locator(".lab4")).toHaveAttribute(
    "data-lab4-theme",
    /^(light|dark)$/,
  );
  await expectPainted(page, "h1");
  // the shrug pose, and a way back
  await expect(page.locator('img[src*="t4bot-shrug"]')).toBeVisible();
  await expect(page.getByRole("link", { name: /หน้าแรก|Home/ })).toBeVisible();
});
