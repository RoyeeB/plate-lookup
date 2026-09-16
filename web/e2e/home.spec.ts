import { test, expect, expectAccessible } from './support';
import { PLATES } from './fixtures';

test.describe('home', () => {
  test('is accessible in light and dark', async ({ page }) => {
    await page.emulateMedia({ colorScheme: 'light' });
    await page.goto('/');
    await expect(page.getByRole('heading', { name: 'איתור פרטי רכב' })).toBeVisible();
    await expectAccessible(page);

    await page.emulateMedia({ colorScheme: 'dark' });
    await page.reload();
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
    await expectAccessible(page);
  });

  test('explains an invalid plate instead of searching', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('textbox', { name: 'מספר לוחית רישוי' }).fill('123');
    await page.getByRole('button', { name: 'חפש רכב' }).click();
    await expect(page.getByRole('alert')).toHaveText('מספר לוחית לא תקין — יש להזין 5 עד 8 ספרות');
    await expect(page).toHaveURL('/');
  });

  test('searches, then lists the car by name in recent searches', async ({ page }) => {
    await page.goto('/');
    const input = page.getByRole('textbox', { name: 'מספר לוחית רישוי' });
    await input.fill(PLATES.hyundai);
    await expect(page.locator('.plate-field--valid')).toBeVisible();
    await input.press('Enter');

    await expect(page).toHaveURL(`/vehicle/${PLATES.hyundai}`);
    await expect(page.getByRole('heading', { level: 2, name: 'יונדאי I10' })).toBeVisible();

    await page.goto('/');
    await expect(page.getByRole('button', { name: /חפש שוב יונדאי I10 · 2016/ })).toBeVisible();
  });

  test('theme choice applies before paint and survives a reload', async ({ page }) => {
    await page.emulateMedia({ colorScheme: 'light' });
    await page.goto('/');
    const toggle = page.getByRole('button', { name: /ערכת צבעים/ });
    await toggle.click(); // system → light
    await toggle.click(); // light → dark
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');

    // Checked at DOMContentLoaded: set by the inline script, not by React.
    await page.reload({ waitUntil: 'domcontentloaded' });
    expect(await page.evaluate(() => document.documentElement.dataset.theme)).toBe('dark');
  });
});
