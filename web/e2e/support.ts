/**
 * Shared test setup: network fixtures on every page, and a guard that fails
 * any test which logs a console error, throws, or trips the CSP.
 */
import { test as base, expect, type Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { mockNetwork } from './fixtures';

interface Fixtures {
  /** Console errors a test expects (matched as substrings), e.g. a forced API failure. */
  expectedErrors: string[];
}

export const test = base.extend<Fixtures>({
  expectedErrors: [[], { option: true }],
  page: async ({ page, expectedErrors }, use) => {
    const problems: string[] = [];
    page.on('console', (message) => {
      if (message.type() !== 'error') return;
      const text = message.text();
      if (!expectedErrors.some((expected) => text.includes(expected))) problems.push(text);
    });
    page.on('pageerror', (error) => problems.push(`pageerror: ${error.message}`));
    await page.addInitScript(() => {
      document.addEventListener('securitypolicyviolation', (event) => {
        console.error(`CSP violation: ${event.violatedDirective} ${event.blockedURI}`);
      });
    });
    await mockNetwork(page);

    await use(page);

    expect(problems, 'console errors, page errors or CSP violations').toEqual([]);
  },
});

export { expect };

/**
 * WCAG 2.1 A/AA scan of the current page. Motion is turned off first so the
 * scan sees final colours, not an element half-way through fading in.
 */
export async function expectAccessible(page: Page): Promise<void> {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  const results = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
    .analyze();
  const summary = results.violations.map(
    (v) => `${v.id} (${v.impact}): ${v.nodes.map((n) => n.target.join(' ')).slice(0, 3).join(' | ')}`
  );
  expect(summary, 'accessibility violations').toEqual([]);
}
