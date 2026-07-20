import { test, expect, type Page } from "@playwright/test";

/**
 * The hero carousel is Blueprint-bounded (fix2.md).
 *
 * It used to break out to 100vw while every other element on the page — nav,
 * hero copy, robot stage, stats, section heads, footer wordmark — aligned to the
 * centred shell, which made it read as an advertising ticker rather than
 * editorial kinetic typography. These assertions pin the boundary discipline so
 * a future "make it bigger" edit can't quietly restore the full-bleed version.
 */

async function boxes(page: Page) {
  return page.evaluate(() => {
    const mq = document.querySelector<HTMLElement>(".lab4-marquee")!;
    const shell = document.querySelector<HTMLElement>(".lab4-shell")!;
    const cs = getComputedStyle(shell);
    const m = mq.getBoundingClientRect();
    const s = shell.getBoundingClientRect();
    return {
      mq: { left: m.left, right: m.right },
      // the shell's CONTENT box — where the hero copy actually starts
      content: {
        left: s.left + parseFloat(cs.paddingLeft),
        right: s.right - parseFloat(cs.paddingRight),
      },
      viewport: window.innerWidth,
      docOverflow:
        document.documentElement.scrollWidth > document.documentElement.clientWidth,
      mask:
        getComputedStyle(mq).maskImage ||
        getComputedStyle(mq).webkitMaskImage ||
        "",
    };
  });
}

test("the carousel is bounded by the page grid, never the viewport edge", async ({
  page,
}) => {
  await page.goto("/", { waitUntil: "networkidle" });
  const b = await boxes(page);

  // neither visible boundary is the physical screen edge
  expect(b.mq.left, "carousel touches the left viewport edge").toBeGreaterThan(8);
  expect(
    b.viewport - b.mq.right,
    "carousel touches the right viewport edge",
  ).toBeGreaterThan(8);

  // and both boundaries sit on the shell's content columns — the same line the
  // hero copy, stats and section heads align to (1px tolerance for borders)
  expect(Math.abs(b.mq.left - b.content.left)).toBeLessThanOrEqual(2);
  expect(Math.abs(b.mq.right - b.content.right)).toBeLessThanOrEqual(2);

  // the moving track must never widen the document
  expect(b.docOverflow, "carousel caused horizontal page overflow").toBe(false);

  // entry/exit is a soft mask, not a hard clip
  expect(b.mask).toContain("gradient");
});

test("the carousel keeps its gutters at 375px and causes no overflow", async ({
  page,
}) => {
  await page.setViewportSize({ width: 375, height: 800 });
  await page.goto("/", { waitUntil: "networkidle" });
  const b = await boxes(page);

  expect(b.mq.left, "mobile gutter below ~20px").toBeGreaterThanOrEqual(18);
  expect(b.viewport - b.mq.right).toBeGreaterThanOrEqual(18);
  expect(b.docOverflow, "horizontal overflow at 375px").toBe(false);
});

// fix2 Visual Hierarchy: the semantic H1 carries the message; the carousel is
// support. If they ever compete again, this is the assertion that fails.
test("the H1 outranks the carousel and carries the real message", async ({
  page,
}) => {
  await page.goto("/", { waitUntil: "networkidle" });

  const sizes = await page.evaluate(() => {
    const px = (el: Element) => parseFloat(getComputedStyle(el).fontSize);
    return {
      h1: px(document.querySelector("h1")!),
      item: px(document.querySelector(".kinetic-marquee-item")!),
      itemOpacity: Number(
        getComputedStyle(document.querySelector(".kinetic-marquee-item")!).opacity,
      ),
      h1Text: document.querySelector("h1")!.textContent?.trim() ?? "",
    };
  });

  // the carousel may be larger, but it must be visually subordinate
  expect(sizes.itemOpacity).toBeLessThan(0.3);
  expect(sizes.h1, "mobile/desktop H1 floor from fix1").toBeGreaterThanOrEqual(30);
  expect(sizes.h1Text.length, "H1 must carry the positioning message").toBeGreaterThan(10);

  // decorative repetition stays out of the accessibility tree
  await expect(page.locator(".kinetic-marquee")).toHaveAttribute(
    "aria-hidden",
    "true",
  );
});

test("reduced motion shows a static phrase instead of a moving track", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/", { waitUntil: "networkidle" });

  const anim = await page.evaluate(
    () =>
      getComputedStyle(document.querySelector(".kinetic-marquee-track")!)
        .animationName,
  );
  expect(anim, "track still animates under prefers-reduced-motion").toBe("none");
  await expect(page.locator(".kinetic-marquee-item").first()).toBeVisible();
});
