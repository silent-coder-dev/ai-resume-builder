import { defineConfig, devices } from '@playwright/test';

// End-to-end tests for the PRD §26 scenarios.
// Run `npm run build` first. On Windows the installed Microsoft Edge is used;
// elsewhere run `npx playwright install chromium` once.
const PORT = 3123;
const baseURL = process.env.E2E_BASE_URL ?? `http://localhost:${PORT}`;
const channel = process.env.PLAYWRIGHT_CHANNEL ?? (process.platform === 'win32' ? 'msedge' : undefined);

export default defineConfig({
  testDir: 'tests/e2e',
  timeout: 60_000,
  expect: { timeout: 10_000 },
  fullyParallel: false,
  workers: 1,
  reporter: [['list']],
  use: {
    baseURL,
    channel,
    trace: 'retain-on-failure',
  },
  webServer: process.env.E2E_BASE_URL
    ? undefined
    : {
        command: `npm run start -- -p ${PORT}`,
        url: baseURL,
        reuseExistingServer: true,
        timeout: 120_000,
      },
  projects: [
    { name: 'desktop', use: { viewport: { width: 1440, height: 900 } }, testIgnore: /mobile\.spec\.ts/ },
    { name: 'mobile', use: { ...devices['Pixel 7'], channel }, testMatch: /mobile\.spec\.ts/ },
  ],
});
