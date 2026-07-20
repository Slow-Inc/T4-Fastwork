import { test, expect, type Page } from "@playwright/test";

/**
 * Dark-mode navbar material (fix3.md).
 *
 * Light mode reads as glass for free — a white environment produces its own
 * reflection. The dark surface had none and flattened into a black bar. The fix
 * adds four layers of studio lighting, and the risk it carries is the opposite
 * failure: drifting into the animated rainbow "aurora" treatment that reads as
 * crypto/gaming. These assertions pin BOTH edges of that — enough material to
 * be dimensional, restrained enough to stay professional.
 */

async function navMaterial(page: Page) {
  return page.evaluate(() => {
    const nav = document.querySelector<HTMLElement>(".site-nav")!;
    const cs = getComputedStyle(nav);
    const before = getComputedStyle(nav, "::before");
    const after = getComputedStyle(nav, "::after");
    return {
      height: nav.getBoundingClientRect().height,
      backdrop: cs.backdropFilter || cs.webkitBackdropFilter || "",
      shadow: cs.boxShadow,
      lightField: before.backgroundImage,
      edge: after.backgroundImage,
      beforeEvents: before.pointerEvents,
      afterEvents: after.pointerEvents,
      anims: [cs.animationName, before.animationName, after.animationName],
      docOverflow:
        document.documentElement.scrollWidth > document.documentElement.clientWidth,
    };
  });
}

test("dark navbar is lit glass, not a flat black card", async ({ page }) => {
  await page.emulateMedia({ colorScheme: "dark" });
  await page.goto("/", { waitUntil: "networkidle" });
  await expect(page.locator(".lab4")).toHaveAttribute("data-lab4-theme", "dark");

  const m = await navMaterial(page);

  // 1 · smoked-glass base — the blueprint stays faintly visible through it
  expect(m.backdrop, "dark navbar lost its backdrop blur").toContain("blur");

  // 2 · internal refracted-light field, cool at the logo + warm at the CTA
  expect(m.lightField).toContain("radial-gradient");
  expect(
    (m.lightField.match(/radial-gradient/g) ?? []).length,
    "expected both a cool and a warm light source",
  ).toBeGreaterThanOrEqual(2);

  // 3 · top-edge reflection
  expect(m.edge).toContain("linear-gradient");

  // 4 · exterior separation bloom, contained
  expect(m.shadow.split(",").length).toBeGreaterThanOrEqual(2);

  // decorative layers never intercept pointer input or cover the focus ring
  expect(m.beforeEvents).toBe("none");
  expect(m.afterEvents).toBe("none");

  // "no continuous decorative animation runs by default"
  for (const a of m.anims) expect(a).toBe("none");

  expect(m.docOverflow, "navbar lighting caused horizontal overflow").toBe(false);
});

// The anti-aurora clause: cool white / pale cyan / one warm accent only. If a
// future edit reaches for purple-blue-pink, this fails.
test("the navbar light stays cool-white plus one warm accent — no aurora", async ({
  page,
}) => {
  await page.emulateMedia({ colorScheme: "dark" });
  await page.goto("/", { waitUntil: "networkidle" });

  const rgbs = await page.evaluate(() => {
    const img = getComputedStyle(
      document.querySelector(".site-nav")!,
      "::before",
    ).backgroundImage;
    return [...img.matchAll(/rgba?\(([^)]+)\)/g)].map((m) =>
      m[1].split(",").slice(0, 3).map((n) => parseFloat(n)),
    );
  });

  for (const [r, g, b] of rgbs) {
    if (r === 0 && g === 0 && b === 0) continue; // transparent stops
    const warm = r > g && g >= b; // the orange signal
    const cool = b >= g && g >= r; // white / pale cyan
    expect(
      warm || cool,
      `navbar light ${r},${g},${b} is neither cool-white nor the warm signal`,
    ).toBe(true);
    // no magenta/purple: blue high while green sits below both neighbours
    expect(b > r && g < r, `purple-ish navbar light ${r},${g},${b}`).toBe(false);
  }
});

// Light mode is the reference for material quality and must not inherit the
// dark treatment; the navbar's dimensions must be identical in both themes.
test("light mode keeps its simpler white glass and the same dimensions", async ({
  page,
}) => {
  await page.emulateMedia({ colorScheme: "dark" });
  await page.goto("/", { waitUntil: "networkidle" });
  const dark = await navMaterial(page);

  await page.locator(".lab4-theme-btn").click();
  await expect(page.locator(".lab4")).toHaveAttribute("data-lab4-theme", "light");
  const light = await navMaterial(page);

  // "must not increase Navbar height to accommodate the effect"
  expect(light.height).toBeCloseTo(dark.height, 1);
  // light mode does not carry the dark refracted-light field
  expect(light.lightField).not.toContain("radial-gradient");
  expect(light.backdrop).toContain("blur");
});
