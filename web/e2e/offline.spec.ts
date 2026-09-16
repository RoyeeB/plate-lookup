import { test, expect } from './support';
import { PLATES } from './fixtures';

test.use({ expectedErrors: ['Failed to load resource', 'net::ERR_INTERNET_DISCONNECTED', 'Network request failed'] });

test('reopens a looked-up car offline, labelled as saved data', async ({ page, context }) => {
  await page.goto(`/vehicle/${PLATES.volvo}`);
  await expect(page.getByRole('region', { name: "צ'קליסט לקונה" })).toContainText('2 נקודות לבדיקה');
  // The app shell must be cached by the service worker before going offline.
  await page.evaluate(async () => {
    await navigator.serviceWorker.ready;
  });
  await page.reload();
  await expect(page.getByRole('heading', { level: 2, name: 'וולבו XC60 B5 FWD' })).toBeVisible();

  // Route handlers keep answering even when the context is offline, so make the
  // registry genuinely unreachable too, as it would be without a connection.
  await page.unroute('https://data.gov.il/**');
  await page.route('https://data.gov.il/**', (route) => route.abort('internetdisconnected'));
  await context.setOffline(true);
  await page.reload();

  await expect(page.getByText(/מידע שמור מ-/)).toBeVisible();
  await expect(page.getByRole('heading', { level: 2, name: 'וולבו XC60 B5 FWD' })).toBeVisible();
  await expect(page.getByRole('region', { name: "צ'קליסט לקונה" })).toContainText('ריקול');
});
