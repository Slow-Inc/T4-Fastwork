import { test, expect, type Page } from '@playwright/test';

/**
 * Real-browser smoke checks for every public page (Requirement §9). Catches what
 * unit tests can't: hydration errors and layout collapse where the fixed navbar
 * ends up overlapping the footer/content.
 */
const PAGES = [
  '/',
  '/about',
  '/projects',
  '/projects/mangadock',
  '/faq',
  '/contact',
  '/pricing-guide',
  '/blog',
  '/blog/rag-chatbot-for-business',
  '/recommend/saas',
  '/bw',
  '/chat',
  '/privacy',
  '/terms',
  '/team/xenodev',
  '/team/slowgers',
];

/** Fail the test if the page logs a console error or throws. */
function trackErrors(page: Page): string[] {
  const errors: string[] = [];
  page.on('console', (m) => {
    if (m.type() === 'error') errors.push(m.text());
  });
  page.on('pageerror', (e) => errors.push(e.message));
  return errors;
}

for (const path of PAGES) {
  test(`renders without errors or navbar overlap: ${path}`, async ({ page }) => {
    const errors = trackErrors(page);
    await page.goto(path, { waitUntil: 'networkidle' });

    // A visible <h1> proves the main content rendered (didn't collapse).
    await expect(page.locator('h1').first()).toBeVisible();

    const nav = await page.locator('nav').first().boundingBox();
    expect(nav, 'nav should exist').not.toBeNull();

    // The footer must sit well below the fixed navbar — if content collapses,
    // the footer rides up under the nav (the reported "navbar ทับกัน" bug).
    // Some pages (e.g. /chat) intentionally have no footer.
    const footerCount = await page.locator('footer').count();
    if (footerCount > 0) {
      const footer = await page.locator('footer').first().boundingBox();
      expect(
        footer!.y,
        'footer overlaps the navbar — content likely collapsed',
      ).toBeGreaterThan(nav!.y + nav!.height + 200);
    }

    // Only the site nav may be position:fixed. A stray fixed <nav> (e.g. the
    // footer link groups or breadcrumb, from an over-broad `nav {}` rule) rides
    // up and overlaps the real navbar.
    const strayFixed = await page.evaluate(() =>
      [...document.querySelectorAll('footer nav, .breadcrumb')].filter(
        (el) => getComputedStyle(el).position === 'fixed',
      ).length,
    );
    expect(strayFixed, 'a footer/breadcrumb <nav> is fixed and overlaps the navbar').toBe(0);

    // No hydration / runtime errors in the console.
    expect(errors, `console errors on ${path}`).toEqual([]);
  });
}

test('/about shows the real SDLC alongside the client-facing "how we work" steps', async ({
  page,
}) => {
  await page.goto('/about', { waitUntil: 'networkidle' });
  await expect(page.getByRole('heading', { name: 'ขั้นตอนการทำงาน' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'SDLC ที่เราใช้จริง' })).toBeVisible();
  for (const phase of [
    'วิเคราะห์ความต้องการ (Requirement Analysis)',
    'ออกแบบระบบ (Design & Architecture)',
    'พัฒนา (Development)',
    'ทดสอบ (Testing & QA)',
    'ส่งขึ้นระบบจริง (Deployment)',
    'ดูแลหลังส่งมอบ (Maintenance & Support)',
  ]) {
    await expect(page.getByRole('heading', { name: phase })).toBeVisible();
  }
});

test('/about lists the team as a directory that links to each real profile', async ({ page }) => {
  await page.goto('/about', { waitUntil: 'networkidle' });
  await expect(page.getByRole('heading', { name: 'ทีมที่ลงมือสร้างจริง' })).toBeVisible();

  const rows = page.locator('.team-dir-item');
  await expect(rows).toHaveCount(6);

  // Each row links to that member's profile page.
  await expect(page.locator('a[href="/team/xenodev"]')).toContainText('xenodev');
  await expect(page.locator('a[href="/team/slowgers"]')).toContainText('Slowgers');

  // Shared team (org) projects appear once, credited to real contributors.
  await expect(page.getByText('MangaDock')).toBeVisible();

  // Clicking a row navigates to the profile page.
  await page.locator('a[href="/team/xenodev"]').click();
  await expect(page).toHaveURL(/\/team\/xenodev$/);
  await expect(page.getByRole('heading', { level: 1, name: 'xenodev' })).toBeVisible();
});

test('a member profile shows real repos and opens certificates in a lightbox', async ({ page }) => {
  const errors = trackErrors(page);
  await page.goto('/team/xenodev', { waitUntil: 'networkidle' });

  // Real audited repos render as projects with outbound links.
  await expect(page.getByRole('link', { name: /Hype-Macro_Store/ })).toHaveAttribute(
    'href',
    'https://github.com/xenodeve/Hype-Macro_Store',
  );
  await expect(page.getByRole('link', { name: /Home-IoT-System/ })).toBeVisible();

  // Tech stack shows a real logo (masked SVG) for a known brand.
  await expect(page.locator('.tech-ico').first()).toBeVisible();

  // Clicking a certificate opens the lightbox with a download link.
  await page.locator('.tm-cert-open').first().click();
  const modal = page.locator('.tm-modal');
  await expect(modal).toBeVisible();
  await expect(modal.locator('.tm-modal-img')).toBeVisible();

  // The modal must be a fixed, full-viewport overlay — not left in normal flow
  // (a stale/colliding stylesheet once made it position:static, so it opened
  // off-screen while body scroll stayed locked = the "frozen page" bug). Assert it
  // actually covers the viewport and its close control is reachable on-screen.
  const vp = page.viewportSize()!;
  const box = (await modal.boundingBox())!;
  expect(box.y, 'modal not anchored to the viewport top').toBeLessThanOrEqual(1);
  expect(box.height, 'modal does not fill the viewport height').toBeGreaterThan(vp.height * 0.9);
  const closeBox = (await page.locator('.tm-modal-close').boundingBox())!;
  expect(closeBox.y, 'close button is off-screen (unreachable)').toBeGreaterThanOrEqual(0);
  expect(closeBox.y).toBeLessThan(vp.height);
  await expect(modal.getByRole('link', { name: 'PDF' })).toHaveAttribute(
    'href',
    '/certificates/xenodev/ai-for-all.pdf',
  );

  // Escape closes it.
  await page.keyboard.press('Escape');
  await expect(modal).toHaveCount(0);

  expect(errors, 'console errors on /team/xenodev').toEqual([]);
});

test('experience + project-count claims are accurate everywhere (5 years, 21+ projects)', async ({
  page,
}) => {
  for (const path of ['/', '/about']) {
    await page.goto(path, { waitUntil: 'networkidle' });
    const bodyText = await page.locator('body').innerText();
    expect(bodyText, `${path} should not claim 20 years`).not.toContain('20 ปี');
    expect(bodyText, `${path} should not claim 20+ years`).not.toContain('20+');
    expect(bodyText, `${path} should not claim 500 projects`).not.toContain('500');
    expect(bodyText, `${path} should claim 21+ projects`).toContain('21+');
  }
});

test('homepage also shows the SDLC section', async ({ page }) => {
  await page.goto('/', { waitUntil: 'networkidle' });
  const section = page.locator('#sdlc');
  await expect(section.getByRole('heading', { name: 'SDLC ที่เราใช้จริง' })).toBeVisible();
  await expect(section.getByText('พัฒนา (Development)')).toBeVisible();
});

test('SDLC rows have a hover micro-transition', async ({ page }) => {
  await page.goto('/', { waitUntil: 'networkidle' });
  const row = page.locator('#sdlc .sdlc-row').first();

  const transition = await row.evaluate((el) => getComputedStyle(el).transitionDuration);
  expect(transition, 'sdlc row should declare a transition duration').not.toBe('0s');

  const paddingBefore = await row.evaluate((el) => getComputedStyle(el).paddingLeft);
  await row.hover();
  await expect(async () => {
    const paddingAfter = await row.evaluate((el) => getComputedStyle(el).paddingLeft);
    expect(paddingAfter).not.toBe(paddingBefore);
  }).toPass({ timeout: 2000 });
});

test('navbar keeps its frosted-glass backdrop blur', async ({ page }) => {
  // The build (Lightning CSS) can drop the standard `backdrop-filter` when a
  // `-webkit-` copy is hand-written alongside it, leaving Chrome with no blur.
  await page.goto('/', { waitUntil: 'networkidle' });
  const bf = await page.evaluate(
    () => getComputedStyle(document.querySelector('.site-nav')!).backdropFilter,
  );
  expect(bf, 'navbar backdrop-filter blur is missing').toContain('blur');
});

test('FAQ list items expand with a smooth transition', async ({ page }) => {
  await page.goto('/faq', { waitUntil: 'networkidle' });
  const item = page.locator('.faq-item').first();
  const answer = item.locator('.faq-a');

  const transition = await answer.evaluate((el) => getComputedStyle(el).transitionDuration);
  expect(transition, 'faq answer should declare a transition duration').not.toBe('0s');

  await expect(answer).not.toBeVisible();
  await item.locator('.faq-q').click();
  await expect(answer).toBeVisible();
});

test('FAQ items slide down into place with a cascading stagger', async ({ page }) => {
  await page.goto('/faq', { waitUntil: 'networkidle' });
  const items = page.locator('.faq-item');

  const delays = await items.evaluateAll((els) =>
    els.map((el) => getComputedStyle(el).transitionDelay),
  );
  expect(delays[0], 'first item should have no delay').toBe('0s');
  expect(delays[1], 'second item should be staggered after the first').not.toBe(delays[0]);

  // All items settle into their resting position once scrolled into view.
  await expect(items.first()).toHaveCSS('opacity', '1', { timeout: 3000 });
  await items.last().scrollIntoViewIfNeeded();
  await expect(items.last()).toHaveCSS('opacity', '1', { timeout: 3000 });
});

test('contact form renders and works without a Turnstile key (feature-flagged)', async ({
  page,
}) => {
  // Not submitting here — a real submit would insert a lead into the live DB.
  await page.goto('/contact', { waitUntil: 'networkidle' });
  const form = page.locator('form.contact-form');
  await expect(form.locator('input[name="name"]')).toBeVisible();
  await expect(form.locator('input[name="email"]')).toBeVisible();
  await expect(form.locator('textarea[name="message"]')).toBeVisible();
  // Turnstile is feature-flagged: no site key in this env → no widget rendered.
  await expect(page.locator('.cf-turnstile')).toHaveCount(0);
});

test('AI greeting popup appears on first visit and "ไว้ก่อน" dismisses without navigating', async ({
  page,
}) => {
  await page.goto('/', { waitUntil: 'networkidle' });
  const popup = page.locator('.ai-greeting');
  await expect(popup).toBeVisible({ timeout: 6000 });
  await popup.getByRole('button', { name: 'ไว้ก่อน' }).click();
  await expect(popup).toBeHidden();
  expect(new URL(page.url()).pathname).toBe('/');
});

test('AI greeting popup "เอาเลย พาชมหน่อย" navigates to /chat', async ({ page }) => {
  await page.goto('/', { waitUntil: 'networkidle' });
  const popup = page.locator('.ai-greeting');
  await expect(popup).toBeVisible({ timeout: 6000 });
  await popup.getByRole('link', { name: 'เอาเลย พาชมหน่อย' }).click();
  await page.waitForURL('**/chat');
});

test('AI greeting popup does not show on /chat', async ({ page }) => {
  await page.goto('/chat', { waitUntil: 'networkidle' });
  await page.waitForTimeout(3000);
  await expect(page.locator('.ai-greeting')).toHaveCount(0);
});

test('AI reply eventually renders streamed text without a stuck typing cursor', async ({
  page,
}) => {
  // route.fulfill() delivers the whole SSE body at once (no real chunk delay), so
  // this can't reliably catch the cursor mid-stream — that's covered by the
  // deterministic unit test (lib/chat-message.test.ts: shouldShowTypingCursor).
  // This checks the cursor doesn't get stuck once streaming legitimately ends.
  await page.route('**/chat/stream', async (route) => {
    const body =
      'event: session\ndata: {"sessionId":"e2e-typing-test"}\n\n' +
      'event: token\ndata: {"text":"สวัสดีครับ"}\n\n' +
      'event: done\ndata: {"latencyMs":10}\n\n';
    await route.fulfill({ status: 200, contentType: 'text/event-stream', body });
  });

  await page.goto('/chat', { waitUntil: 'networkidle' });
  await page.getByPlaceholder('พิมพ์ข้อความ…').fill('ทดสอบ');
  await page.getByRole('button', { name: 'ส่ง' }).click();

  await expect(page.getByText('สวัสดีครับ').last()).toBeVisible();
  await expect(page.locator('.typing-cursor')).toHaveCount(0);
});

test('scope summary panel shows a tooltip before any conversation', async ({ page }) => {
  await page.goto('/chat', { waitUntil: 'networkidle' });
  await page.locator('.scope-panel-toggle').click();
  await expect(
    page.getByText('เริ่มพูดคุยกับ AI ระบบจะสรุปขอบเขตงานให้อัตโนมัติ'),
  ).toBeVisible();
});

test('project detail "ask AI about this project" opens the floating widget grounded in it', async ({
  page,
}) => {
  let requestBody: Record<string, unknown> | null = null;
  await page.route('**/chat/stream', async (route) => {
    requestBody = route.request().postDataJSON();
    const body =
      'event: session\ndata: {"sessionId":"e2e-widget-project-chat"}\n\n' +
      'event: token\ndata: {"text":"เป็นระบบ OCR ครับ"}\n\n' +
      'event: done\ndata: {"latencyMs":10}\n\n';
    await route.fulfill({ status: 200, contentType: 'text/event-stream', body });
  });

  await page.goto('/projects/mangadock', { waitUntil: 'networkidle' });

  // Stays on the project page — no navigation to /chat.
  await page.getByRole('button', { name: 'ถามรายละเอียดผลงานนี้กับ AI' }).click();
  await expect(page).toHaveURL(/\/projects\/mangadock$/);

  const panel = page.locator('.chat-panel');
  await expect(panel).toBeVisible();
  await expect(panel.locator('.chat-project-banner')).toContainText('MangaDock');

  await expect
    .poll(() => requestBody?.projectSlug, { timeout: 5000 })
    .toBe('mangadock');
  expect((requestBody?.message as string) ?? '').toContain('MangaDock');
});

test('home shows the team directory and a tech-stack marquee — spec P8', async ({
  page,
}) => {
  const errors: string[] = [];
  page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
  await page.goto('/', { waitUntil: 'networkidle' });

  // The team is visible on the home page (credibility — real people).
  await expect(page.locator('#team')).toBeVisible();
  await expect(
    page.locator('#team').getByRole('link', { name: /xenodev|Slowgers/ }).first(),
  ).toBeVisible();
  // The tech-stack marquee renders its track.
  await expect(page.locator('.tech-marquee-track')).toBeVisible();
  expect(errors).toEqual([]);
});

test('project detail shows an owner chip (team/personal) — spec P6', async ({
  page,
}) => {
  const errors: string[] = [];
  page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
  await page.goto('/projects/mangadock', { waitUntil: 'networkidle' });

  // The owner chip labels whose project this is (MangaDock = a team project).
  const chip = page.locator('.owner-chip');
  await expect(chip).toBeVisible();
  await expect(chip).toContainText('T4 Labs');
  // Live contributors/README overlay is graceful when the backend is offline —
  // the page must still render its h1 with no console errors.
  await expect(page.locator('h1')).toBeVisible();
  expect(errors).toEqual([]);
});

test('arriving at /chat with ?project= shows a banner and grounds the auto-sent question', async ({
  page,
}) => {
  let requestBody: Record<string, unknown> | null = null;
  await page.route('**/chat/stream', async (route) => {
    requestBody = route.request().postDataJSON();
    const body =
      'event: session\ndata: {"sessionId":"e2e-project-chat"}\n\n' +
      'event: token\ndata: {"text":"เป็นระบบ OCR ครับ"}\n\n' +
      'event: done\ndata: {"latencyMs":10}\n\n';
    await route.fulfill({ status: 200, contentType: 'text/event-stream', body });
  });

  await page.goto('/chat?project=mangadock', { waitUntil: 'networkidle' });

  await expect(page.locator('.chat-project-banner')).toContainText('MangaDock');
  await expect(page.getByText('MangaDock', { exact: false }).first()).toBeVisible();

  await expect
    .poll(() => requestBody?.projectSlug, { timeout: 5000 })
    .toBe('mangadock');
  expect((requestBody?.message as string) ?? '').toContain('MangaDock');

  await page.locator('.chat-project-banner button').click();
  await expect(page.locator('.chat-project-banner')).toHaveCount(0);
});

test('every page declares its own canonical + hreflang alternates', async ({ page }) => {
  for (const path of ['/about', '/faq', '/blog/rag-chatbot-for-business']) {
    await page.goto(path, { waitUntil: 'networkidle' });
    const canonical = await page
      .locator('link[rel="canonical"]')
      .getAttribute('href');
    expect(canonical, `canonical on ${path}`).toContain(path);

    const hreflangCount = await page.locator('link[rel="alternate"][hreflang]').count();
    expect(hreflangCount, `hreflang alternates on ${path}`).toBeGreaterThanOrEqual(3);
  }
});

test('clicking a tracked CTA navigates without console errors', async ({ page }) => {
  const errors = trackErrors(page);
  await page.goto('/', { waitUntil: 'networkidle' });
  await page.locator('nav').first().getByRole('link', { name: /ติดต่อ/i }).click();
  await page.waitForURL('**/contact');
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  expect(errors, 'console errors after clicking a tracked CTA').toEqual([]);
});

test('language switch flips nav + content to English', async ({ page }) => {
  await page.goto('/about', { waitUntil: 'networkidle' });
  const nav = page.locator('nav').first();
  await expect(nav.getByRole('link', { name: 'ผลงาน' })).toBeVisible();
  await nav.getByRole('button', { name: /Switch language/i }).click();
  await expect(nav.getByRole('link', { name: 'Work' })).toBeVisible();
  await expect(page.getByRole('heading', { level: 1 })).toContainText(/team|ships/i);
});

test('home credentials open in the same lightbox as team, and it is dismissable', async ({
  page,
}) => {
  const errors = trackErrors(page);
  await page.goto('/about', { waitUntil: 'networkidle' });

  // The credential rows are buttons that open the shared .tm-modal lightbox.
  await page.locator('.crow').first().scrollIntoViewIfNeeded();
  await page.locator('.crow').first().click();
  const modal = page.locator('.tm-modal');
  await expect(modal).toBeVisible();

  // Same regression guard as the team lightbox: fixed, full-viewport overlay.
  const vp = page.viewportSize()!;
  const box = (await modal.boundingBox())!;
  expect(box.y).toBeLessThanOrEqual(1);
  expect(box.height).toBeGreaterThan(vp.height * 0.9);

  await page.keyboard.press('Escape');
  await expect(modal).toHaveCount(0);
  expect(errors, 'console errors on /about credentials').toEqual([]);
});

test('the floating AI chat panel animates open', async ({ page }) => {
  await page.goto('/', { waitUntil: 'networkidle' });
  await page.getByRole('button', { name: /Ask T4 AI/i }).click();
  const panel = page.locator('.chat-panel');
  await expect(panel).toBeVisible();
  const anim = await panel.evaluate((el) => getComputedStyle(el).animationName);
  expect(anim, 'chat panel should declare an open animation').not.toBe('none');
});

test('the floating chat keeps its conversation when closed and reopened', async ({ page }) => {
  await page.goto('/', { waitUntil: 'networkidle' });
  await page.getByRole('button', { name: /Ask T4 AI/i }).click();

  const panel = page.locator('.chat-panel');
  await expect(panel).toBeVisible();
  await panel.locator('input, textarea').first().fill('จำคำนี้ได้ไหม APPLE123');
  await panel.getByRole('button', { name: 'ส่ง' }).click();
  await expect(panel.getByText('APPLE123')).toBeVisible();

  // Close, then reopen — the message must still be there.
  await page.getByRole('button', { name: /ปิด/ }).click();
  await expect(page.locator('.chat-panel')).toHaveCount(0);
  await page.getByRole('button', { name: /Ask T4 AI/i }).click();
  await expect(page.locator('.chat-panel').getByText('APPLE123')).toBeVisible();
});
