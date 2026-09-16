/**
 * End-to-end tests against the production build, served by `vite preview`
 * with the real security headers from vercel.json. Runs on the installed
 * Chrome (no browser download). Registry and Wikipedia traffic is answered
 * from fixtures, so results don't depend on live data or rate limits.
 */
import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: 'e2e',
  timeout: 60_000,
  expect: { timeout: 10_000 },
  fullyParallel: true,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? 'github' : 'list',
  use: {
    baseURL: 'http://localhost:4173',
    channel: 'chrome',
    locale: 'he-IL',
    timezoneId: 'Asia/Jerusalem',
    trace: 'retain-on-failure',
  },
  projects: [
    {
      name: 'mobile',
      use: { viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, deviceScaleFactor: 2 },
    },
    { name: 'desktop', use: { viewport: { width: 1366, height: 900 } } },
  ],
  webServer: {
    command: 'npm run build && npx vite preview --port 4173 --strictPort',
    url: 'http://localhost:4173',
    // Always a fresh build: a stale preview server would test old code.
    reuseExistingServer: false,
    timeout: 180_000,
  },
});
