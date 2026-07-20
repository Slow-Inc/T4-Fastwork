import { test, expect, type Page } from "@playwright/test";

/**
 * Real-browser smoke checks for every public page (Requirement §9). Catches what
 * unit tests can't: hydration errors and layout collapse where the fixed navbar
 * ends up overlapping the footer/content.
 */
const PAGES = [
  "/",
  "/about",
  "/projects",
  "/projects/mangadock",
  "/faq",
  "/contact",
  "/pricing-guide",
  "/blog",
  "/blog/rag-chatbot-for-business",
  "/recommend/saas",
  "/bw",
  "/chat",
  "/privacy",
  "/terms",
  "/team/xenodev",
  "/team/slowgers",
  "/legacy-2",
];

/** Fail the test if the page logs a console error or throws. */
function trackErrors(page: Page): string[] {
  const errors: string[] = [];
  page.on("console", (m) => {
    if (m.type() !== "error") return;
    const text = m.text();
    // Third-party sub-resource outages (profile READMEs embed external badge/stats
    // images — shields.io, skillicons, github-readme-stats… — that rate-limit or
    // 5xx intermittently) are not our bug. Ignore a resource-load failure only when
    // its URL is cross-origin; a same-origin (first-party) failure still fails, so
    // this smoke check keeps catching our own broken assets/routes.
    if (/Failed to load resource/i.test(text)) {
      const url = m.location()?.url ?? "";
      try {
        if (url && new URL(url).origin !== new URL(page.url()).origin) return;
      } catch {
        // Unknown origin → treat as first-party and let it fail (conservative).
      }
    }
    errors.push(text);
  });
  page.on("pageerror", (e) => errors.push(e.message));
  return errors;
}

for (const path of PAGES) {
  test(`renders without errors or navbar overlap: ${path}`, async ({
    page,
  }) => {
    const errors = trackErrors(page);
    await page.goto(path, { waitUntil: "networkidle" });

    // A visible <h1> proves the main content rendered (didn't collapse).
    await expect(page.locator("h1").first()).toBeVisible();

    const nav = await page.locator("nav").first().boundingBox();
    expect(nav, "nav should exist").not.toBeNull();

    // The footer must sit well below the fixed navbar — if content collapses,
    // the footer rides up under the nav (the reported "navbar ทับกัน" bug).
    // Some pages (e.g. /chat) intentionally have no footer.
    const footerCount = await page.locator("footer").count();
    if (footerCount > 0) {
      const footer = await page.locator("footer").first().boundingBox();
      expect(
        footer!.y,
        "footer overlaps the navbar — content likely collapsed",
      ).toBeGreaterThan(nav!.y + nav!.height + 200);
    }

    // Only the site nav may be position:fixed. A stray fixed <nav> (e.g. the
    // footer link groups or breadcrumb, from an over-broad `nav {}` rule) rides
    // up and overlaps the real navbar.
    const strayFixed = await page.evaluate(
      () =>
        [...document.querySelectorAll("footer nav, .breadcrumb")].filter(
          (el) => getComputedStyle(el).position === "fixed",
        ).length,
    );
    expect(
      strayFixed,
      "a footer/breadcrumb <nav> is fixed and overlaps the navbar",
    ).toBe(0);

    // No hydration / runtime errors in the console.
    expect(errors, `console errors on ${path}`).toEqual([]);
  });
}

test('/about shows the real SDLC alongside the client-facing "how we work" steps', async ({
  page,
}) => {
  await page.goto("/about", { waitUntil: "networkidle" });
  await expect(
    page.getByRole("heading", { name: "ขั้นตอนการทำงาน" }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "SDLC ที่เราใช้จริง" }),
  ).toBeVisible();
  for (const phase of [
    "วิเคราะห์ความต้องการ (Requirement Analysis)",
    "ออกแบบระบบ (Design & Architecture)",
    "พัฒนา (Development)",
    "ทดสอบ (Testing & QA)",
    "ส่งขึ้นระบบจริง (Deployment)",
    "ดูแลหลังส่งมอบ (Maintenance & Support)",
  ]) {
    await expect(page.getByRole("heading", { name: phase })).toBeVisible();
  }
});

test("/about lists the team as a directory that links to each real profile", async ({
  page,
}) => {
  await page.goto("/about", { waitUntil: "networkidle" });
  await expect(
    page.getByRole("heading", { name: "ทีมที่ลงมือสร้างจริง" }),
  ).toBeVisible();

  const rows = page.locator(".team-dir-item");
  await expect(rows).toHaveCount(6);

  // Each row links to that member's profile page.
  await expect(page.locator('a[href="/team/xenodev"]')).toContainText(
    "xenodev",
  );
  await expect(page.locator('a[href="/team/slowgers"]')).toContainText(
    "Slowgers",
  );

  // Shared team (org) projects appear once, credited to real contributors.
  await expect(page.getByText("MangaDock")).toBeVisible();

  // Clicking a row navigates to the profile page.
  await page.locator('a[href="/team/xenodev"]').click();
  await expect(page).toHaveURL(/\/team\/xenodev$/);
  await expect(
    page.getByRole("heading", { level: 1, name: "xenodev" }),
  ).toBeVisible();
});

test("a member profile shows real repos and opens certificates in a lightbox", async ({
  page,
}) => {
  const errors = trackErrors(page);
  await page.goto("/team/xenodev", { waitUntil: "networkidle" });

  // Real audited repos render as projects with outbound links.
  await expect(
    page.getByRole("link", { name: /Hype-Macro_Store/ }),
  ).toHaveAttribute("href", "https://github.com/xenodeve/Hype-Macro_Store");
  await expect(
    page.getByRole("link", { name: /Home-IoT-System/ }),
  ).toBeVisible();

  // Tech stack shows a real logo (masked SVG) for a known brand.
  await expect(page.locator(".tech-ico").first()).toBeVisible();

  // Clicking a certificate opens the lightbox with a download link.
  await page.locator(".tm-cert-open").first().click();
  const modal = page.locator(".tm-modal");
  await expect(modal).toBeVisible();
  await expect(modal.locator(".tm-modal-img")).toBeVisible();

  // The modal must be a fixed, full-viewport overlay — not left in normal flow
  // (a stale/colliding stylesheet once made it position:static, so it opened
  // off-screen while body scroll stayed locked = the "frozen page" bug). Assert it
  // actually covers the viewport and its close control is reachable on-screen.
  const vp = page.viewportSize()!;
  const box = (await modal.boundingBox())!;
  expect(box.y, "modal not anchored to the viewport top").toBeLessThanOrEqual(
    1,
  );
  expect(box.height, "modal does not fill the viewport height").toBeGreaterThan(
    vp.height * 0.9,
  );
  const closeBox = (await page.locator(".tm-modal-close").boundingBox())!;
  expect(
    closeBox.y,
    "close button is off-screen (unreachable)",
  ).toBeGreaterThanOrEqual(0);
  expect(closeBox.y).toBeLessThan(vp.height);
  // Certs now come from the DB (member CMS migration) ordered by ai_rank, with
  // PDFs in Supabase Storage — not the old static /certificates/... path. Assert
  // the opened cert offers a Storage-hosted PDF download.
  await expect(modal.getByRole("link", { name: "PDF" })).toHaveAttribute(
    "href",
    /^https:\/\/[a-z0-9]+\.supabase\.co\/storage\/v1\/object\/public\/media\/member-certs\/.+\.pdf$/i,
  );

  // Escape closes it.
  await page.keyboard.press("Escape");
  await expect(modal).toHaveCount(0);

  expect(errors, "console errors on /team/xenodev").toEqual([]);
});

test("experience + project-count claims are accurate everywhere (7 years, 21+ projects)", async ({
  page,
}) => {
  for (const path of ["/", "/about"]) {
    await page.goto(path, { waitUntil: "networkidle" });
    const bodyText = await page.locator("body").innerText();
    expect(bodyText, `${path} should not claim 20 years`).not.toContain(
      "20 ปี",
    );
    expect(bodyText, `${path} should not claim 20+ years`).not.toContain("20+");
    expect(bodyText, `${path} should not claim 500 projects`).not.toContain(
      "500",
    );
    expect(bodyText, `${path} should claim 21+ projects`).toContain("21+");
  }
});

// The live home is now the /lab4 composition rendered verbatim (dev directive
// 2026-07-20), which deliberately carries none of the req1 product sections.
// They live on the /legacy-2 backup, so these contracts follow them there.
test("the legacy home backup still shows the SDLC section", async ({ page }) => {
  await page.goto("/legacy-2", { waitUntil: "networkidle" });
  const section = page.locator("#sdlc");
  await expect(
    section.getByRole("heading", { name: "SDLC ที่เราใช้จริง" }),
  ).toBeVisible();
  await expect(section.getByText("พัฒนา (Development)")).toBeVisible();
});

test("SDLC rows have a hover micro-transition", async ({ page }) => {
  await page.goto("/legacy-2", { waitUntil: "networkidle" });
  const row = page.locator("#sdlc .sdlc-row").first();

  const transition = await row.evaluate(
    (el) => getComputedStyle(el).transitionDuration,
  );
  expect(transition, "sdlc row should declare a transition duration").not.toBe(
    "0s",
  );

  const paddingBefore = await row.evaluate(
    (el) => getComputedStyle(el).paddingLeft,
  );
  await row.hover();
  await expect(async () => {
    const paddingAfter = await row.evaluate(
      (el) => getComputedStyle(el).paddingLeft,
    );
    expect(paddingAfter).not.toBe(paddingBefore);
  }).toPass({ timeout: 2000 });
});

test("navbar keeps its frosted-glass backdrop blur", async ({ page }) => {
  // The build (Lightning CSS) can drop the standard `backdrop-filter` when a
  // `-webkit-` copy is hand-written alongside it, leaving Chrome with no blur.
  // (checked on /about — the home now renders the lab4 shell with its own nav)
  await page.goto("/about", { waitUntil: "networkidle" });
  const bf = await page.evaluate(
    () => getComputedStyle(document.querySelector(".site-nav")!).backdropFilter,
  );
  expect(bf, "navbar backdrop-filter blur is missing").toContain("blur");
});

test("FAQ list items expand with a smooth transition", async ({ page }) => {
  await page.goto("/faq", { waitUntil: "networkidle" });
  const item = page.locator(".faq-item").first();
  const answer = item.locator(".faq-a");

  const transition = await answer.evaluate(
    (el) => getComputedStyle(el).transitionDuration,
  );
  expect(
    transition,
    "faq answer should declare a transition duration",
  ).not.toBe("0s");

  await expect(answer).not.toBeVisible();
  await item.locator(".faq-q").click();
  await expect(answer).toBeVisible();
});

test("FAQ items slide down into place with a cascading stagger", async ({
  page,
}) => {
  await page.goto("/faq", { waitUntil: "networkidle" });
  const items = page.locator(".faq-item");

  const delays = await items.evaluateAll((els) =>
    els.map((el) => getComputedStyle(el).transitionDelay),
  );
  expect(delays[0], "first item should have no delay").toBe("0s");
  expect(delays[1], "second item should be staggered after the first").not.toBe(
    delays[0],
  );

  // All items settle into their resting position once scrolled into view.
  await expect(items.first()).toHaveCSS("opacity", "1", { timeout: 3000 });
  await items.last().scrollIntoViewIfNeeded();
  await expect(items.last()).toHaveCSS("opacity", "1", { timeout: 3000 });
});

test("contact form renders and works without a Turnstile key (feature-flagged)", async ({
  page,
}) => {
  // Not submitting here — a real submit would insert a lead into the live DB.
  await page.goto("/contact", { waitUntil: "networkidle" });
  const form = page.locator("form.contact-form");
  await expect(form.locator('input[name="name"]')).toBeVisible();
  await expect(form.locator('input[name="email"]')).toBeVisible();
  await expect(form.locator('textarea[name="message"]')).toBeVisible();
  // Turnstile is feature-flagged: no site key in this env → no widget rendered.
  await expect(page.locator(".cf-turnstile")).toHaveCount(0);
});

test('AI greeting popup appears on first visit and "ไว้ก่อน" dismisses without navigating', async ({
  page,
}) => {
  await page.goto("/", { waitUntil: "networkidle" });
  const popup = page.locator(".ai-greeting");
  await expect(popup).toBeVisible({ timeout: 6000 });
  await popup.getByRole("button", { name: "ไว้ก่อน" }).click();
  await expect(popup).toBeHidden();
  expect(new URL(page.url()).pathname).toBe("/");
});

test('AI greeting popup "เอาเลย พาชมหน่อย" navigates to /chat', async ({
  page,
}) => {
  await page.goto("/", { waitUntil: "networkidle" });
  const popup = page.locator(".ai-greeting");
  await expect(popup).toBeVisible({ timeout: 6000 });
  await popup.getByRole("link", { name: "เอาเลย พาชมหน่อย" }).click();
  await page.waitForURL("**/chat");
});

test("AI greeting popup does not show on /chat", async ({ page }) => {
  await page.goto("/chat", { waitUntil: "networkidle" });
  await page.waitForTimeout(3000);
  await expect(page.locator(".ai-greeting")).toHaveCount(0);
});

test("AI reply eventually renders streamed text without a stuck typing cursor", async ({
  page,
}) => {
  // route.fulfill() delivers the whole SSE body at once (no real chunk delay), so
  // this can't reliably catch the cursor mid-stream — that's covered by the
  // deterministic unit test (lib/chat-message.test.ts: shouldShowTypingCursor).
  // This checks the cursor doesn't get stuck once streaming legitimately ends.
  await page.route("**/chat/stream", async (route) => {
    const body =
      'event: session\ndata: {"sessionId":"e2e-typing-test"}\n\n' +
      'event: token\ndata: {"text":"สวัสดีครับ"}\n\n' +
      'event: done\ndata: {"latencyMs":10}\n\n';
    await route.fulfill({
      status: 200,
      contentType: "text/event-stream",
      body,
    });
  });

  await page.goto("/chat", { waitUntil: "networkidle" });
  await page.getByPlaceholder("พิมพ์ข้อความ…").fill("ทดสอบ");
  await page.getByRole("button", { name: "ส่ง" }).click();

  await expect(page.getByText("สวัสดีครับ").last()).toBeVisible();
  await expect(page.locator(".typing-cursor")).toHaveCount(0);
});

test("scope summary panel shows a tooltip before any conversation", async ({
  page,
}) => {
  await page.goto("/chat", { waitUntil: "networkidle" });
  await page.locator(".scope-panel-toggle").click();
  await expect(
    page.getByText("เริ่มพูดคุยกับ AI ระบบจะสรุปขอบเขตงานให้อัตโนมัติ"),
  ).toBeVisible();
});

test('project detail "ask AI about this project" opens the floating widget grounded in it', async ({
  page,
}) => {
  let requestBody: Record<string, unknown> | null = null;
  await page.route("**/chat/stream", async (route) => {
    requestBody = route.request().postDataJSON();
    const body =
      'event: session\ndata: {"sessionId":"e2e-widget-project-chat"}\n\n' +
      'event: token\ndata: {"text":"เป็นระบบ OCR ครับ"}\n\n' +
      'event: done\ndata: {"latencyMs":10}\n\n';
    await route.fulfill({
      status: 200,
      contentType: "text/event-stream",
      body,
    });
  });

  await page.goto("/projects/mangadock", { waitUntil: "networkidle" });

  // Stays on the project page — no navigation to /chat.
  await page
    .getByRole("button", { name: "ถามรายละเอียดผลงานนี้กับ AI" })
    .click();
  await expect(page).toHaveURL(/\/projects\/mangadock$/);

  const panel = page.locator(".chat-panel");
  await expect(panel).toBeVisible();
  await expect(panel.locator(".chat-project-banner")).toContainText(
    "MangaDock",
  );

  await expect
    .poll(() => requestBody?.projectSlug, { timeout: 5000 })
    .toBe("mangadock");
  expect((requestBody?.message as string) ?? "").toContain("MangaDock");
});

test("the legacy home backup keeps the team directory and filterable tech-stack — spec P8 / §4.1.8", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("console", (m) => m.type() === "error" && errors.push(m.text()));
  // moved off "/" with the lab4 swap; #team also lives on /about, but #tech's
  // filter contract only survives here until it is rebuilt in the v3 language
  await page.goto("/legacy-2", { waitUntil: "networkidle" });

  // The team is visible on the page (credibility — real people).
  await expect(page.locator("#team")).toBeVisible();
  await expect(
    page
      .locator("#team")
      .getByRole("link", { name: /xenodev|Slowgers/ })
      .first(),
  ).toBeVisible();
  // The tech-stack section renders clickable chips that filter /projects
  // (§4.1.8) — the single, non-redundant tech display (the duplicate marquee
  // was removed).
  const chip = page.locator("#tech .tech-chip").first();
  await expect(chip).toBeVisible();
  await expect(chip).toHaveAttribute("href", /\/projects\?tech=/);
  expect(errors).toEqual([]);
});

test("project detail shows an owner chip (team/personal) — spec P6", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("console", (m) => m.type() === "error" && errors.push(m.text()));
  await page.goto("/projects/mangadock", { waitUntil: "networkidle" });

  // The owner chip labels whose project this is (MangaDock = a team project).
  const chip = page.locator(".owner-chip");
  await expect(chip).toBeVisible();
  await expect(chip).toContainText("T4 Labs");
  // The page must render its title h1 with no console errors. `.first()` targets
  // the project title — when the backend is up, the live README (spec P6/P7)
  // renders its own markdown H1s below, so there are legitimately several.
  await expect(page.locator("h1").first()).toBeVisible();
  expect(errors).toEqual([]);
});

test("arriving at /chat with ?project= shows a banner and grounds the auto-sent question", async ({
  page,
}) => {
  let requestBody: Record<string, unknown> | null = null;
  await page.route("**/chat/stream", async (route) => {
    requestBody = route.request().postDataJSON();
    const body =
      'event: session\ndata: {"sessionId":"e2e-project-chat"}\n\n' +
      'event: token\ndata: {"text":"เป็นระบบ OCR ครับ"}\n\n' +
      'event: done\ndata: {"latencyMs":10}\n\n';
    await route.fulfill({
      status: 200,
      contentType: "text/event-stream",
      body,
    });
  });

  await page.goto("/chat?project=mangadock", { waitUntil: "networkidle" });

  await expect(page.locator(".chat-project-banner")).toContainText("MangaDock");
  await expect(
    page.getByText("MangaDock", { exact: false }).first(),
  ).toBeVisible();

  await expect
    .poll(() => requestBody?.projectSlug, { timeout: 5000 })
    .toBe("mangadock");
  expect((requestBody?.message as string) ?? "").toContain("MangaDock");

  await page.locator(".chat-project-banner button").click();
  await expect(page.locator(".chat-project-banner")).toHaveCount(0);
});

test("/chat renders the Open WebUI-style sidebar app-shell (#39)", async ({
  page,
}) => {
  const errors = trackErrors(page);
  await page.goto("/chat", { waitUntil: "networkidle" });

  const sidebar = page.locator(".chat-sidebar");
  await expect(sidebar).toBeVisible();
  await expect(sidebar.getByRole("button", { name: "แชทใหม่" })).toBeVisible();
  // Identity footer (the assistant, not a user account).
  await expect(sidebar.getByText("T4 Labs")).toBeVisible();
  // The conversation pane still holds the composer.
  await expect(page.getByPlaceholder("พิมพ์ข้อความ…")).toBeVisible();
  expect(errors, "console errors on /chat app-shell").toEqual([]);
});

test("New Chat starts a fresh conversation; the sidebar switches back to the old one (#39)", async ({
  page,
}) => {
  await page.route("**/chat/stream", async (route) => {
    const body =
      'event: session\ndata: {"sessionId":"e2e-shell-switch"}\n\n' +
      'event: token\ndata: {"text":"รับทราบครับ"}\n\n' +
      'event: done\ndata: {"latencyMs":10}\n\n';
    await route.fulfill({
      status: 200,
      contentType: "text/event-stream",
      body,
    });
  });

  await page.goto("/chat", { waitUntil: "networkidle" });

  // Send a first message — the active conversation now has content + a title.
  await page.getByPlaceholder("พิมพ์ข้อความ…").fill("มะม่วง MANGO1");
  await page.locator(".chat-pane").getByRole("button", { name: "ส่ง" }).click();
  await expect(page.locator(".chat-pane").getByText("MANGO1")).toBeVisible();
  // The conversation is titled from that first message in the sidebar.
  await expect(
    page.locator(".chat-history-title").filter({ hasText: "MANGO1" }),
  ).toBeVisible();

  // New Chat → a fresh greeting-only conversation (the old message is gone).
  await page.getByRole("button", { name: "แชทใหม่" }).click();
  await expect(page.locator(".chat-pane").getByText("MANGO1")).toHaveCount(0);

  // Switching back via the sidebar restores the old conversation's messages.
  await page
    .locator(".chat-history-open")
    .filter({ hasText: "MANGO1" })
    .click();
  await expect(page.locator(".chat-pane").getByText("MANGO1")).toBeVisible();
});

test("sidebar conversations can be renamed and deleted (#39)", async ({
  page,
}) => {
  await page.route("**/chat/stream", async (route) => {
    const body =
      'event: session\ndata: {"sessionId":"e2e-shell-crud"}\n\n' +
      'event: token\ndata: {"text":"รับทราบครับ"}\n\n' +
      'event: done\ndata: {"latencyMs":10}\n\n';
    await route.fulfill({
      status: 200,
      contentType: "text/event-stream",
      body,
    });
  });

  await page.goto("/chat", { waitUntil: "networkidle" });
  await page.getByPlaceholder("พิมพ์ข้อความ…").fill("ลูกพีช PEACH9");
  await page.locator(".chat-pane").getByRole("button", { name: "ส่ง" }).click();
  const row = page.locator(".chat-history-row").filter({ hasText: "PEACH9" });
  await expect(row).toBeVisible();

  // Rename → inline input, commit with Enter.
  await row.hover();
  await row.getByRole("button", { name: /เปลี่ยนชื่อ/ }).click();
  const rename = page.getByRole("textbox", { name: "เปลี่ยนชื่อบทสนทนา" });
  await rename.fill("งานที่ตั้งชื่อเอง");
  await rename.press("Enter");
  await expect(
    page.locator(".chat-history-row").filter({ hasText: "งานที่ตั้งชื่อเอง" }),
  ).toBeVisible();

  // Delete → inline confirm → the row is gone.
  const named = page
    .locator(".chat-history-row")
    .filter({ hasText: "งานที่ตั้งชื่อเอง" });
  await named.hover();
  await named.getByRole("button", { name: /ลบ/ }).click();
  await page.getByRole("button", { name: "ยืนยันลบ" }).click();
  await expect(
    page.locator(".chat-history-row").filter({ hasText: "งานที่ตั้งชื่อเอง" }),
  ).toHaveCount(0);
});

test("empty state shows the identity + suggestions, and a suggestion sends (#40)", async ({
  page,
}) => {
  await page.route("**/chat/stream", async (route) => {
    const body =
      'event: session\ndata: {"sessionId":"e2e-empty-state"}\n\n' +
      'event: token\ndata: {"text":"รับทราบครับ"}\n\n' +
      'event: done\ndata: {"latencyMs":10}\n\n';
    await route.fulfill({
      status: 200,
      contentType: "text/event-stream",
      body,
    });
  });

  await page.goto("/chat", { waitUntil: "networkidle" });

  // First-run screen: centered identity + suggestion list + composer.
  await expect(page.locator(".chat-empty-title")).toHaveText("ผู้ช่วย AI");
  await expect(page.locator(".chat-suggest-row")).toHaveCount(4);
  await expect(page.getByPlaceholder("พิมพ์ข้อความ…")).toBeVisible();

  // Clicking a suggestion sends it → the empty state gives way to the conversation.
  await page.locator(".chat-suggest-row").first().click();
  await expect(page.locator(".chat-empty")).toHaveCount(0);
  await expect(
    page.locator(".chat-pane").getByText("อยากได้ SaaS platform"),
  ).toBeVisible();
  await expect(
    page.locator(".chat-pane").getByText("รับทราบครับ"),
  ).toBeVisible();
});

test("assistant turns get a copy + regenerate action row (#41)", async ({
  page,
  context,
}) => {
  let calls = 0;
  await page.route("**/chat/stream", async (route) => {
    calls += 1;
    const body =
      'event: session\ndata: {"sessionId":"e2e-actions"}\n\n' +
      `event: token\ndata: {"text":"คำตอบที่ ${calls}"}\n\n` +
      'event: done\ndata: {"latencyMs":10}\n\n';
    await route.fulfill({
      status: 200,
      contentType: "text/event-stream",
      body,
    });
  });
  await context.grantPermissions(["clipboard-read", "clipboard-write"]);

  await page.goto("/chat", { waitUntil: "networkidle" });
  await page.getByPlaceholder("พิมพ์ข้อความ…").fill("ทดสอบ actions");
  await page.locator(".chat-pane").getByRole("button", { name: "ส่ง" }).click();
  await expect(
    page.locator(".chat-pane").getByText("คำตอบที่ 1"),
  ).toBeVisible();

  const turn = page.locator(".chat-turn.chat-assistant").last();
  await turn.hover();

  // Copy puts the assistant text on the clipboard + shows "copied" feedback.
  await turn.getByRole("button", { name: /คัดลอก/ }).click();
  await expect(turn.getByText("คัดลอกแล้ว")).toBeVisible();
  const clip = await page.evaluate(() => navigator.clipboard.readText());
  expect(clip).toContain("คำตอบที่ 1");

  // Regenerate re-runs the previous user turn into a fresh answer.
  await turn.getByRole("button", { name: "สร้างคำตอบใหม่" }).click();
  await expect(
    page.locator(".chat-pane").getByText("คำตอบที่ 2"),
  ).toBeVisible();
  await expect(page.locator(".chat-pane").getByText("คำตอบที่ 1")).toHaveCount(
    0,
  );
});

test("/chat shows a top identity strip and renders user turns as a pill (#43)", async ({
  page,
}) => {
  await page.route("**/chat/stream", async (route) => {
    const body =
      'event: session\ndata: {"sessionId":"e2e-strip-pill"}\n\n' +
      'event: token\ndata: {"text":"รับทราบครับ"}\n\n' +
      'event: done\ndata: {"latencyMs":10}\n\n';
    await route.fulfill({
      status: 200,
      contentType: "text/event-stream",
      body,
    });
  });

  await page.goto("/chat", { waitUntil: "networkidle" });

  // Slim identity strip at the top of the conversation pane.
  const strip = page.locator(".chat-topstrip");
  await expect(strip).toContainText("ผู้ช่วย AI");
  await expect(strip).toContainText("T4 Labs");

  // A user turn renders as a subtle pill (bordered + rounded), not bare text.
  await page.getByPlaceholder("พิมพ์ข้อความ…").fill("สวัสดี PILL1");
  await page.locator(".chat-pane").getByRole("button", { name: "ส่ง" }).click();
  const pill = page
    .locator(".chat-user .chat-text")
    .filter({ hasText: "PILL1" });
  await expect(pill).toBeVisible();
  const style = await pill.evaluate((el) => {
    const s = getComputedStyle(el);
    return { border: s.borderTopWidth, radius: s.borderTopLeftRadius };
  });
  expect(style.border).not.toBe("0px");
  expect(style.radius).not.toBe("0px");
});

test("composer attaches an image, previews it, and sends it with the user turn (#42)", async ({
  page,
}) => {
  let sentImages: unknown = null;
  await page.route("**/chat/stream", async (route) => {
    sentImages = (route.request().postDataJSON() as { images?: unknown }).images;
    const body =
      'event: session\ndata: {"sessionId":"e2e-image"}\n\n' +
      'event: token\ndata: {"text":"เห็นรูปแล้วครับ"}\n\n' +
      'event: done\ndata: {"latencyMs":10}\n\n';
    await route.fulfill({
      status: 200,
      contentType: "text/event-stream",
      body,
    });
  });

  await page.goto("/chat", { waitUntil: "networkidle" });

  // Stage a real 1×1 PNG on the (hidden) file input.
  const png = Buffer.from(
    "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==",
    "base64",
  );
  await page
    .locator('.chat-input-row input[type="file"]')
    .setInputFiles({ name: "shot.png", mimeType: "image/png", buffer: png });

  // A preview thumbnail appears; sending clears it.
  await expect(page.locator(".chat-attach-thumb")).toHaveCount(1);
  await page.locator(".chat-pane .chat-send").click();
  await expect(page.locator(".chat-attach-thumb")).toHaveCount(0);

  // The image renders in the user turn and reached the backend as a data URL.
  await expect(page.locator(".chat-user .chat-msg-image")).toBeVisible();
  await expect(
    page.locator(".chat-pane").getByText("เห็นรูปแล้วครับ"),
  ).toBeVisible();
  expect(Array.isArray(sentImages)).toBe(true);
  expect((sentImages as string[])[0]).toMatch(/^data:image\/png;base64,/);
});

test("assistant answers render full Markdown (GFM + code) like Open WebUI", async ({
  page,
  context,
}) => {
  const md = [
    "# หัวข้อทดสอบ",
    "",
    "ข้อความ **ตัวหนา** กับ `inline code` และ [ลิงก์](https://t4labs.dev).",
    "",
    "- ข้อแรก",
    "- ข้อสอง",
    "",
    "| ชื่อ | ค่า |",
    "| --- | --- |",
    "| alpha | 1 |",
    "| beta | 2 |",
    "",
    "```js",
    "const answer = 42;",
    "console.log(answer);",
    "```",
  ].join("\n");
  await page.route("**/chat/stream", async (route) => {
    const body =
      'event: session\ndata: {"sessionId":"e2e-md"}\n\n' +
      "event: token\ndata: " +
      JSON.stringify({ text: md }) +
      "\n\n" +
      'event: done\ndata: {"latencyMs":10}\n\n';
    await route.fulfill({
      status: 200,
      contentType: "text/event-stream",
      body,
    });
  });
  await context.grantPermissions(["clipboard-read", "clipboard-write"]);

  await page.goto("/chat", { waitUntil: "networkidle" });
  await page.getByPlaceholder("พิมพ์ข้อความ…").fill("ขอ markdown");
  await page.locator(".chat-pane").getByRole("button", { name: "ส่ง" }).click();

  const md0 = page.locator(".chat-md").last();
  await expect(md0.locator("h1")).toHaveText("หัวข้อทดสอบ");
  await expect(md0.locator("strong")).toHaveText("ตัวหนา");
  await expect(md0.locator("li")).toHaveCount(2);
  // GFM table renders with real cells.
  await expect(md0.locator("table td").first()).toHaveText("alpha");
  // Link opens in a new tab, safely.
  const link = md0.locator('a[href="https://t4labs.dev"]');
  await expect(link).toHaveAttribute("target", "_blank");
  await expect(link).toHaveAttribute("rel", /noopener/);
  // Fenced code block: language chip + highlighted code + working copy button.
  await expect(md0.locator(".chat-code-lang")).toHaveText("js");
  await expect(md0.locator("pre code .hljs-keyword").first()).toBeVisible();
  await md0.locator(".chat-code-copy").click();
  await expect(md0.getByText("คัดลอกแล้ว")).toBeVisible();
  const clip = await page.evaluate(() => navigator.clipboard.readText());
  expect(clip).toContain("const answer = 42;");
});

test("you can keep typing while the assistant is responding, but cannot send until it finishes", async ({
  page,
}) => {
  let release: () => void = () => {};
  const gate = new Promise<void>((r) => {
    release = r;
  });
  await page.route("**/chat/stream", async (route) => {
    await gate; // hold the response open so the client stays "busy"
    const body =
      'event: session\ndata: {"sessionId":"e2e-busy"}\n\n' +
      'event: token\ndata: {"text":"ตอบแล้วครับ"}\n\n' +
      'event: done\ndata: {"latencyMs":10}\n\n';
    await route.fulfill({
      status: 200,
      contentType: "text/event-stream",
      body,
    });
  });

  await page.goto("/chat", { waitUntil: "networkidle" });
  const composer = page.getByPlaceholder("พิมพ์ข้อความ…");
  const sendBtn = page.locator(".chat-pane .chat-send");

  // Fire a turn — the held-open route leaves the assistant "thinking" (busy).
  await composer.fill("คำถามแรก");
  await sendBtn.click();

  // While busy: the composer stays editable, but sending is blocked.
  await expect(composer).toBeEnabled();
  await composer.fill("พิมพ์ต่อระหว่างรอ");
  await expect(composer).toHaveValue("พิมพ์ต่อระหว่างรอ");
  await expect(sendBtn).toBeDisabled();

  // Let the reply arrive → once idle, the typed text can be sent.
  release();
  await expect(
    page.locator(".chat-pane").getByText("ตอบแล้วครับ"),
  ).toBeVisible();
  await expect(sendBtn).toBeEnabled();
});

test("every page declares its own canonical + hreflang alternates", async ({
  page,
}) => {
  for (const path of ["/about", "/faq", "/blog/rag-chatbot-for-business"]) {
    await page.goto(path, { waitUntil: "networkidle" });
    const canonical = await page
      .locator('link[rel="canonical"]')
      .getAttribute("href");
    expect(canonical, `canonical on ${path}`).toContain(path);

    const hreflangCount = await page
      .locator('link[rel="alternate"][hreflang]')
      .count();
    expect(
      hreflangCount,
      `hreflang alternates on ${path}`,
    ).toBeGreaterThanOrEqual(3);
  }
});

test("clicking a tracked CTA navigates without console errors", async ({
  page,
}) => {
  const errors = trackErrors(page);
  // from /about — the home's lab4 nav links to in-page anchors, not routes
  await page.goto("/about", { waitUntil: "networkidle" });
  await page
    .locator("nav")
    .first()
    .getByRole("link", { name: /ติดต่อ/i })
    .click();
  await page.waitForURL("**/contact");
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  expect(errors, "console errors after clicking a tracked CTA").toEqual([]);
});

test("language switch flips nav + content to English", async ({ page }) => {
  await page.goto("/about", { waitUntil: "networkidle" });
  const nav = page.locator("nav").first();
  await expect(nav.getByRole("link", { name: "ผลงาน" })).toBeVisible();
  await nav.getByRole("button", { name: /Switch language/i }).click();
  await expect(nav.getByRole("link", { name: "Work" })).toBeVisible();
  await expect(page.getByRole("heading", { level: 1 })).toContainText(
    /team|ships/i,
  );
});

test("home credentials open in the same lightbox as team, and it is dismissable", async ({
  page,
}) => {
  const errors = trackErrors(page);
  await page.goto("/about", { waitUntil: "networkidle" });

  // The credential rows are buttons that open the shared .tm-modal lightbox.
  await page.locator(".crow").first().scrollIntoViewIfNeeded();
  await page.locator(".crow").first().click();
  const modal = page.locator(".tm-modal");
  await expect(modal).toBeVisible();

  // The lightbox must show a REAL certificate image using the SAME design as the
  // per-person team lightbox (.tm-modal-img, full/contained) — spec P8 fix.
  const img = modal.locator("img.tm-modal-img");
  await expect(img).toBeVisible();
  await expect(img).toHaveAttribute("src", /\/certificates\//);

  // Same regression guard as the team lightbox: fixed, full-viewport overlay.
  const vp = page.viewportSize()!;
  const box = (await modal.boundingBox())!;
  expect(box.y).toBeLessThanOrEqual(1);
  expect(box.height).toBeGreaterThan(vp.height * 0.9);

  await page.keyboard.press("Escape");
  await expect(modal).toHaveCount(0);
  expect(errors, "console errors on /about credentials").toEqual([]);
});

// The floating chat FAB is a per-page component. The live home now renders the
// lab4 shell (which offers its own /chat entry points instead), so these three
// journeys start from /about, where the FAB still ships.
test("the floating AI chat panel animates open", async ({ page }) => {
  await page.goto("/about", { waitUntil: "networkidle" });
  await page.getByRole("button", { name: /Ask T4 AI/i }).click();
  const panel = page.locator(".chat-panel");
  await expect(panel).toBeVisible();
  const anim = await panel.evaluate((el) => getComputedStyle(el).animationName);
  expect(anim, "chat panel should declare an open animation").not.toBe("none");
});

test("the floating chat keeps its conversation when closed and reopened", async ({
  page,
}) => {
  await page.goto("/about", { waitUntil: "networkidle" });
  await page.getByRole("button", { name: /Ask T4 AI/i }).click();

  const panel = page.locator(".chat-panel");
  await expect(panel).toBeVisible();
  await panel
    .locator('input[type="text"], textarea')
    .first()
    .fill("จำคำนี้ได้ไหม APPLE123");
  await panel.getByRole("button", { name: "ส่ง" }).click();
  await expect(panel.getByText("APPLE123")).toBeVisible();

  // Close, then reopen — the message must still be there. Target the chat
  // FAB specifically: the AI-greeting popup's ✕ is also labelled "ปิด" and
  // can pop mid-test, making the bare role query ambiguous.
  await page.locator("button.chat").filter({ hasText: "ปิด" }).click();
  await expect(page.locator(".chat-panel")).toHaveCount(0);
  await page.getByRole("button", { name: /Ask T4 AI/i }).click();
  await expect(page.locator(".chat-panel").getByText("APPLE123")).toBeVisible();
});

test("the floating popup and the /chat page share one conversation (#31)", async ({
  page,
}) => {
  // three networkidle page-loads in one journey — give this the slow-test
  // budget instead of racing 30s
  test.slow();
  // Type a message in the floating popup...
  await page.goto("/about", { waitUntil: "networkidle" });
  await page.getByRole("button", { name: /Ask T4 AI/i }).click();
  const panel = page.locator(".chat-panel");
  await expect(panel).toBeVisible();
  await panel
    .locator('input[type="text"], textarea')
    .first()
    .fill("ต่อเนื่อง BANANA456");
  await panel.getByRole("button", { name: "ส่ง" }).click();
  await expect(panel.getByText("BANANA456")).toBeVisible();

  // ...expand into the full /chat page — the history carries over (migrated into
  // the app-shell store; it shows both in the conversation pane and, by title, in
  // the sidebar, so this assertion targets the pane specifically).
  await page.goto("/chat", { waitUntil: "networkidle" });
  await expect(page.locator(".chat-pane").getByText("BANANA456")).toBeVisible();

  // ...and the /chat page writes back to the same shared conversation, so
  // returning to the popup still shows the history (symmetric persistence).
  await page.goto("/about", { waitUntil: "networkidle" });
  await page.getByRole("button", { name: /Ask T4 AI/i }).click();
  await expect(
    page.locator(".chat-panel").getByText("BANANA456"),
  ).toBeVisible();
});

test("member area redirects to GitHub login when signed out (#53)", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("console", (m) => m.type() === "error" && errors.push(m.text()));
  // Not signed in → the member area bounces to the login page.
  await page.goto("/member", { waitUntil: "networkidle" });
  await expect(page).toHaveURL(/\/member\/login$/);
  await expect(
    page.getByRole("button", { name: /เข้าสู่ระบบด้วย GitHub/ }),
  ).toBeVisible();
  await expect(page.locator("h1")).toBeVisible();
  expect(errors).toEqual([]);
});
