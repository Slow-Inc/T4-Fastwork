import { test, expect, type Page } from "@playwright/test";

/**
 * Home ↔ /lab4 identity (issue #110). The dev directive of 2026-07-20 is that the
 * live home IS the /lab4 composition "แบบห้ามแก้อะไรทั้งนั้น" — unchanged. Both
 * routes therefore render the same `Lab4Home` component, and this suite is the
 * guard that nobody re-forks them: it diffs the server-rendered shell markup
 * byte-for-byte rather than sampling a handful of parity signals.
 *
 * It also pins the /legacy-2 backup, which is where the previous product home
 * (SiteNav + SDLC + Team + tech chips + work rows) now lives.
 */

/** The shell markup both routes must emit, straight from the server HTML. */
async function shellHtml(page: Page, path: string) {
  const res = await page.request.get(path);
  expect(res.status(), `${path} should render`).toBe(200);
  const html = await res.text();
  const start = html.indexOf('<main class="lab4-shell"');
  const end = html.indexOf("</main>", start);
  expect(start, `${path} should contain the lab4 shell`).toBeGreaterThan(-1);
  return html.slice(start, end + "</main>".length);
}

// The strongest possible parity assertion: identical server markup. If someone
// re-forks the home into its own composition, this fails immediately.
test("home renders the /lab4 composition byte-identically", async ({ page }) => {
  const [home, lab4] = await Promise.all([
    shellHtml(page, "/"),
    shellHtml(page, "/lab4"),
  ]);
  expect(home).toBe(lab4);
  // sanity: the slice really is the v3 shell, not an empty match
  expect(home).toContain('data-l4-zone="hero"');
  expect(home).toContain('data-l4-zone="contact"');
});

// The client-side surface matches too — same robot zones, same tokens — after
// hydration and the robot stage settle.
test("home and /lab4 expose the identical robot zone choreography", async ({
  page,
}) => {
  await page.emulateMedia({ colorScheme: "dark" });

  const read = async (path: string) => {
    await page.goto(path, { waitUntil: "networkidle" });
    await page.waitForFunction(
      () => !!document.querySelector(".lab4[data-lab4-theme]"),
      { timeout: 10_000 },
    );
    return page.evaluate(() => {
      const n = (s: string) => document.querySelectorAll(s).length;
      const zone = (z: string) => {
        const el = document.querySelector<HTMLElement>(`[data-l4-zone="${z}"]`);
        return el ? { ...el.dataset } : null;
      };
      const root = document.querySelector<HTMLElement>(".lab4")!;
      const cs = getComputedStyle(root);
      return {
        theme: root.dataset.lab4Theme,
        zones: {
          hero: zone("hero"),
          how: zone("how"),
          services: zone("services"),
          contact: zone("contact"),
          footer: zone("footer"),
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
          nav: n(".lab4-nav"),
        },
        signal: cs.getPropertyValue("--l4-signal").trim(),
      };
    });
  };

  const lab4 = await read("/lab4");
  const home = await read("/");
  expect(home).toEqual(lab4);
});

// The dual-theme mechanism is one system: same attribute, same localStorage key,
// so a theme set on one route carries to the other.
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

// /legacy-2 is the backup of the previous home. It keeps the req1 product parts
// the lab4 composition deliberately drops, and must stay out of the index.
test("/legacy-2 backs up the previous product home and stays unindexed", async ({
  page,
}) => {
  await page.emulateMedia({ colorScheme: "dark" });
  await page.goto("/legacy-2", { waitUntil: "networkidle" });

  await expect(page.locator(".site-nav")).toHaveCount(1);
  await expect(page.locator("#sdlc .sdlc-row")).toHaveCount(6);
  await expect(page.locator(".team-dir-item")).toHaveCount(6);
  await expect(page.locator("#tech .tech-chip").first()).toBeVisible();
  const workRows = page.locator("#work .lab4-work");
  await expect(workRows.first()).toHaveAttribute("href", /^\/projects\/.+/);

  // a backup, not a second front door
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute(
    "content",
    /noindex/,
  );
});
