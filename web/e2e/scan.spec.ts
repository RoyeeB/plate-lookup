import { test, expect } from './support';

// A fake camera: Chrome's built-in test pattern. There's no plate in it, so a
// working pipeline ends at the "no plate detected" sheet — which proves the
// camera, the OCR engine (loaded from the CDN under the real CSP) and the
// result UI all run.
test.use({
  launchOptions: { args: ['--use-fake-ui-for-media-stream', '--use-fake-device-for-media-stream'] },
  permissions: ['camera'],
});

test('runs the camera and OCR end to end', async ({ page }) => {
  test.slow(); // downloads the OCR engine and language data
  await page.goto('/scan');
  const shutter = page.getByRole('button', { name: 'צלם' });
  await expect(shutter).toBeEnabled({ timeout: 20_000 });
  await expect(page.locator('.scan__beam')).toBeVisible();

  await shutter.click();
  await expect(page.getByText('לא זוהה מספר — נסה שוב או הקלד ידנית')).toBeVisible({ timeout: 90_000 });
  await page.getByRole('button', { name: 'הקלדה ידנית' }).click();
  await expect(page).toHaveURL('/');
});
