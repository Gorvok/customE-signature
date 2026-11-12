import { defineConfig } from '@playwright/test'

/**
 * End-to-end suite. It exercises the service worker update flow, which cannot be
 * covered by the unit tests: it needs a real browser, a real worker lifecycle and
 * two releases served from the same origin.
 *
 * The suite serves the contents of `dist/`, so run `npm run build` first
 * (`npm run test:e2e` does).
 */
export default defineConfig({
  testDir: './e2e',
  // The suite swaps files in the directory it serves, so runs must not overlap.
  fullyParallel: false,
  workers: 1,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [['github'], ['list']] : [['list']],
  // Service worker installs and activations are slow next to ordinary DOM waits.
  timeout: 180_000,
  expect: { timeout: 30_000 },
  use: {
    // Recording every run costs a large slice of CPU, so keep traces for failures only.
    trace: process.env.CI ? 'retain-on-failure' : 'off',
    launchOptions: {
      // Chromium cannot use its own sandbox inside an unprivileged container.
      args: ['--no-sandbox'],
    },
  },
  projects: [
    {
      // Chromium only: it is the engine whose service worker tooling Playwright
      // drives reliably, and the flow under test is not browser-specific.
      name: 'chromium',
      use: { browserName: 'chromium' },
    },
  ],
})
