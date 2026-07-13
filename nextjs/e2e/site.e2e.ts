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

test('/about shows the team\'s real skills and education (synced with Fastwork)', async ({
  page,
}) => {
  await page.goto('/about', { waitUntil: 'networkidle' });
  await expect(page.getByRole('heading', { name: 'ความสามารถของทีม' })).toBeVisible();
  await expect(page.getByText('Next.js', { exact: true })).toBeVisible();
  await expect(page.getByText('MongoDB', { exact: true })).toBeVisible();
  await expect(page.getByText('วิทยาการคอมพิวเตอร์', { exact: true })).toBeVisible();
  await expect(page.getByText('มหาวิทยาลัยกรุงเทพ').first()).toBeVisible();
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

test('contact form carries a hidden reCAPTCHA token field', async ({ page }) => {
  // Not submitting here — a real submit would insert a lead into the live DB.
  // This just confirms the reCAPTCHA wiring is present in the DOM.
  await page.goto('/contact', { waitUntil: 'networkidle' });
  const token = page.locator('form.contact-form input[name="recaptchaToken"]');
  await expect(token).toHaveAttribute('type', 'hidden');
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
