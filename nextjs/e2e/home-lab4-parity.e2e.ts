import { test, expect, type Page } from "@playwright/test";

/**
 * Home ↔ /lab4 parity (issue #110). The live home was lifted wholesale from the
 * /lab4 prototype (ADR 0011 + commit e8a65e6), so the v3 shell they share — theme,
 * robot zones, kinetic hero, Swiss sections, design tokens — must stay in lock-step
 * while the prototype remains the reference. This suite fails if the two drift.
 *
 * It also encodes what home has that lab4 deliberately does NOT (the §14.3 business
 * sections + the production nav), and the numbering-coherence bug this comparison
 * surfaced (a section must never repeat or reverse its index eyebrow).
 */

/** Read the shared v3 surface after the client shell + robot stage settle. */
async function readV3(page: Page) {
  await page.waitForFunction(
    () => !!document.querySelector('.lab4[data-lab4-theme]'),
    { timeout: 10_000 },
  );
  return page.evaluate(() => {
    const n = (s: string) => document.querySelectorAll(s).length;
    const zone = (z: string) => {
      const el = document.querySelector<HTMLElement>(`[data-l4-zone="${z}"]`);
      if (!el) return null;
      const d = el.dataset;
      return {
        scale: d.l4Scale ?? null,
        yaw: d.l4Yaw ?? null,
        pitch: d.l4Pitch ?? null,
        point: d.l4Point ?? null,
        perch: d.l4Perch ?? null,
        mood: d.l4Mood ?? null,
        float: d.l4Float ?? null,
      };
    };
    const root = document.querySelector<HTMLElement>(".lab4")!;
    const cs = getComputedStyle(root);
    const btn = document.querySelector(".lab4-btn.solid");
    const coord = document.querySelector(".lab4-coord");
    return {
      theme: root.dataset.lab4Theme,
      zones: {
        hero: zone("hero"),
        how: zone("how"),
        services: zone("services"),
        contact: zone("contact"),
      },
      counts: {
        sol: n(".lab4-sol"),
        node: n(".lab4-node"),
        step: n(".lab4-step"),
        svc: n(".lab4-svc"),
        trust: n(".lab4-trust > div"),
        marquee: n(".lab4-marquee"),
        wordmark: n(".lab4-wordmark"),
        aiChip: n(".lab4-ai-chip"),
        themeBtn: n(".lab4-theme-btn"),
      },
      tokens: {
        signal: cs.getPropertyValue("--l4-signal").trim(),
        canvasDark: cs.backgroundColor,
      },
      btn: btn && {
        radius: getComputedStyle(btn).borderRadius,
        bg: getComputedStyle(btn).backgroundColor,
      },
      coord: coord && {
        color: getComputedStyle(coord).color,
        ls: getComputedStyle(coord).letterSpacing,
      },
    };
  });
}

// The shared v3 storytelling zones are identical on both pages (same markers,
// same choreography). This is the core parity assertion.
test("home and /lab4 expose the identical robot zone choreography", async ({
  page,
}) => {
  await page.emulateMedia({ colorScheme: "dark" });

  await page.goto("/lab4", { waitUntil: "networkidle" });
  const lab4 = await readV3(page);

  await page.goto("/", { waitUntil: "networkidle" });
  const home = await readV3(page);

  // every shared storytelling zone matches marker-for-marker
  expect(home.zones).toEqual(lab4.zones);

  // and the shared v3 building blocks come through in the same quantities
  for (const k of [
    "sol",
    "node",
    "step",
    "svc",
    "trust",
    "marquee",
    "wordmark",
    "aiChip",
    "themeBtn",
  ] as const) {
    expect(home.counts[k], `count mismatch: ${k}`).toBe(lab4.counts[k]);
  }

  // shared design tokens (accent + button + eyebrow) are one system
  expect(home.tokens.signal).toBe(lab4.tokens.signal);
  expect(home.btn).toEqual(lab4.btn);
  expect(home.coord).toEqual(lab4.coord);
});

// The dual-theme mechanism is shared: same attribute, same localStorage key, so a
// theme set on one page carries to the other.
test("home and /lab4 share the theme mechanism and localStorage key", async ({
  page,
}) => {
  await page.emulateMedia({ colorScheme: "dark" });

  await page.goto("/lab4", { waitUntil: "networkidle" });
  await page.locator(".lab4-theme-btn").click();
  await expect(page.locator(".lab4")).toHaveAttribute("data-lab4-theme", "light");
  const stored = await page.evaluate(() => localStorage.getItem("lab4-theme"));
  expect(stored).toBe("light");

  // the home reads the same key → it opens in light without touching the toggle
  await page.goto("/", { waitUntil: "networkidle" });
  await expect(page.locator(".lab4")).toHaveAttribute("data-lab4-theme", "light");
});

// What home has that lab4 does NOT — the §14.3 business sections and the production
// nav. This is the intended divergence; assert it so a future edit can't silently
// strip a business section back to prototype scope.
test("home carries the §14.3 business sections that the prototype omits", async ({
  page,
}) => {
  await page.emulateMedia({ colorScheme: "dark" });

  await page.goto("/", { waitUntil: "networkidle" });
  // production nav (the one the dev chose to keep), not the lab4 glass nav
  await expect(page.locator(".site-nav")).toHaveCount(1);
  await expect(page.locator(".lab4-nav")).toHaveCount(0);
  // the real sections lab4 has no business carrying
  await expect(page.locator("#sdlc .sdlc-row")).toHaveCount(6);
  await expect(page.locator(".team-dir-item")).toHaveCount(6);
  await expect(page.locator("#tech .tech-chip").first()).toBeVisible();
  await expect(page.locator(".crow").first()).toBeVisible();
  await expect(page.locator("#featured .carousel-slide").first()).toBeVisible();

  await page.goto("/lab4", { waitUntil: "networkidle" });
  await expect(page.locator(".lab4-nav")).toHaveCount(1);
  await expect(page.locator(".site-nav")).toHaveCount(0);
  await expect(page.locator("#sdlc")).toHaveCount(0);
  await expect(page.locator("#team")).toHaveCount(0);
});

// Regression guard for the bug this comparison found: the home stacks its own v3
// section heads with the embedded components' heads, so their index eyebrows must
// form one coherent, non-repeating sequence (no "02" then "01", no duplicate "05").
test("home section index eyebrows are unique and monotonic", async ({ page }) => {
  await page.emulateMedia({ colorScheme: "dark" });
  await page.goto("/", { waitUntil: "networkidle" });

  const nums = await page.evaluate(() => {
    const labels = [
      ...document.querySelectorAll<HTMLElement>(".lab4-coord, .t-idx"),
    ].map((e) => e.textContent?.trim() ?? "");
    // keep only "NN — Word" eyebrows, in DOM order
    return labels
      .map((t) => /^(\d{2})\s*—/.exec(t)?.[1])
      .filter((x): x is string => !!x)
      .map(Number);
  });

  expect(nums.length, "expected several numbered eyebrows").toBeGreaterThan(6);
  // no duplicates (the tech/certs "05 — 05" collision)
  expect(new Set(nums).size, `duplicate index in ${nums}`).toBe(nums.length);
  // strictly increasing in DOM order (the "02 SELECTED WORK → 01 Featured" reversal)
  for (let i = 1; i < nums.length; i++) {
    expect(nums[i], `index out of order at ${nums}`).toBeGreaterThan(nums[i - 1]);
  }
});
