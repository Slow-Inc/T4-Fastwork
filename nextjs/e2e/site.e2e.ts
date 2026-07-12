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

test('contact form carries a hidden reCAPTCHA token field', async ({ page }) => {
  // Not submitting here — a real submit would insert a lead into the live DB.
  // This just confirms the reCAPTCHA wiring is present in the DOM.
  await page.goto('/contact', { waitUntil: 'networkidle' });
  const token = page.locator('form.contact-form input[name="recaptchaToken"]');
  await expect(token).toHaveAttribute('type', 'hidden');
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
