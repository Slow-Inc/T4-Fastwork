import { defineConfig, devices } from '@playwright/test';

/**
 * E2E config (Requirement §9 / dev workflow). Runs real-browser smoke checks
 * that unit tests can't — hydration errors, layout collapse (e.g. the navbar
 * overlapping content), and the language switch. See CLAUDE.md "E2E".
 *
 * Run: `bun run e2e` (from nextjs/). Reuses a dev server on :3000 if running,
 * otherwise builds + starts production.
 */
export default defineConfig({
  testDir: './e2e',
  testMatch: '**/*.e2e.ts',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: 0,
  workers: 2,
  reporter: [['list']],
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: {
    command: 'bun run build && bun run start',
    url: 'http://localhost:3000',
    timeout: 180_000,
    reuseExistingServer: !process.env.CI,
  },
});
