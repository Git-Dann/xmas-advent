import { defineConfig, devices } from '@playwright/test';

/**
 * Browser tests run against the real Cloudflare Pages runtime (wrangler pages dev) with an
 * isolated local D1 database in .wrangler/e2e and the test clock enabled. Never production.
 *
 * WebKit: install once on your machine with `npx playwright install webkit`.
 */
const PORT = 8789;
const STATE = '.wrangler/e2e';

export default defineConfig({
  testDir: 'tests/e2e',
  timeout: 60_000,
  fullyParallel: false,
  workers: 1,
  retries: 0,
  reporter: [['list']],
  use: {
    baseURL: `http://127.0.0.1:${PORT}`,
    trace: 'off',
  },
  projects: [
    { name: 'chromium-iphone', use: { ...devices['iPhone 13'], browserName: 'chromium' } },
    { name: 'webkit-iphone', use: { ...devices['iPhone 13'] } },
    { name: 'chromium-desktop', use: { ...devices['Desktop Chrome'] } },
  ],
  webServer: {
    command:
      `npx wrangler d1 migrations apply the-25th-key --local --persist-to ${STATE} && ` +
      `npx wrangler pages dev dist --port ${PORT} --persist-to ${STATE} ` +
      '--binding ENVIRONMENT=test --binding ALLOW_TEST_CLOCK=1 --binding ADMIN_PASSWORD=e2e-admin-password --binding INVITE_CODES=E2E-KEY-CODE-2026',
    url: `http://127.0.0.1:${PORT}/api/session`,
    reuseExistingServer: false,
    timeout: 120_000,
  },
});
