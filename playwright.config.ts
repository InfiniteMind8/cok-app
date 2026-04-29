import { defineConfig, devices } from '@playwright/test'

const BASE_URL = process.env.PLAYWRIGHT_BASE_URL ?? 'http://localhost:3000'
const IS_CI = !!process.env.CI

export default defineConfig({
  testDir: './tests/e2e',
  // Only run the 10 critical-path specs; ignore the per-feature describe.skip stubs
  testMatch: /[^/\\]+\.spec\.ts$/,
  testIgnore: /\/d\d+-.+\.spec\.ts$/,
  globalSetup: './tests/e2e/global-setup.ts',

  timeout: 45_000,
  expect: { timeout: 10_000 },

  reporter: IS_CI
    ? [['github'], ['html', { outputFolder: 'playwright-report', open: 'never' }]]
    : [['list'], ['html', { outputFolder: 'playwright-report', open: 'on-failure' }]],

  use: {
    baseURL: BASE_URL,
    trace: 'on-first-retry',
    video: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],

  // Spin up the Next.js dev server before running tests.
  // In CI, use `pnpm start` (after `pnpm build`) for reliability.
  webServer: {
    command: IS_CI ? 'pnpm start' : 'pnpm dev',
    url: BASE_URL,
    reuseExistingServer: !IS_CI,
    timeout: IS_CI ? 180_000 : 120_000,
    stdout: 'pipe',
    stderr: 'pipe',
    env: {
      NEXT_PUBLIC_DEMO_MODE_ENABLED: 'true',
    },
  },

  // Sequential workers: tests share a seeded DB; parallelism causes data races
  workers: 1,
  fullyParallel: false,
})
