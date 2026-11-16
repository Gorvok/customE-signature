import type { Page } from '@playwright/test';

/**
 * Console output that is expected rather than the app misbehaving.
 *
 * The signature preview renders inside an iframe sandboxed *without*
 * `allow-scripts`, deliberately — see SignatureFrame. Playwright's trace
 * recorder injects a snapshot script into every frame, Chromium refuses it
 * there, and says so once per frame per navigation. It is the sandbox doing
 * its job: the generated srcdoc contains no script of its own. The message
 * appears only while tracing is enabled, which is to say only on CI — so a
 * spec that filters it locally still fails there. That caught this suite out
 * once, which is why the filter lives here rather than in each spec.
 */
const EXPECTED_CONSOLE_ERRORS = [
  /Blocked script execution in 'about:srcdoc'/,
  /favicon/i,
  /404 \(Not Found\)/i,
];

export interface ConsoleWatch {
  /** Console errors, with the expected noise removed. */
  unexpected: () => string[];
  /** Uncaught exceptions, which are never expected. */
  pageErrors: () => string[];
}

/** Starts recording console errors and uncaught exceptions for a page. */
export function watchConsole(page: Page): ConsoleWatch {
  const consoleErrors: string[] = [];
  const pageErrors: string[] = [];

  page.on('console', (message) => {
    if (message.type() === 'error') consoleErrors.push(message.text());
  });
  page.on('pageerror', (error) => pageErrors.push(String(error)));

  return {
    unexpected: () => consoleErrors.filter((text) => !EXPECTED_CONSOLE_ERRORS.some((p) => p.test(text))),
    pageErrors: () => [...pageErrors],
  };
}
