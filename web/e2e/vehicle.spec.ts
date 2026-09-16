import { test, expect, expectAccessible } from './support';
import { PLATES } from './fixtures';

test.describe('vehicle page', () => {
  test('shows the car, its facts and a clean checklist', async ({ page }) => {
    await page.goto(`/vehicle/${PLATES.hyundai}`);

    await expect(page.getByRole('heading', { level: 2, name: 'יונדאי I10' })).toBeVisible();
    await expect(page.getByText('2016 · INSIGHT · תוצרת טורקיה')).toBeVisible();
    await expect(page.locator('.vehicle-hero__img')).toBeVisible();

    const facts = page.getByRole('region', { name: 'במבט מהיר' });
    await expect(facts).toContainText('110,000');
    await expect(facts).toContainText('יד ראשונה');

    const checklist = page.getByRole('region', { name: "צ'קליסט לקונה" });
    await expect(checklist).toContainText('לא נמצאו נקודות לבדיקה במאגרים');

    // Manufacturer and country as two official rows, not "יונדאי טורקיה".
    const official = page.locator('.card').filter({ hasText: 'פרטי רכב רשמיים' });
    await expect(official.locator('.spec-row', { hasText: 'יצרן' })).toContainText('יונדאי');
    await expect(official.locator('.spec-row', { hasText: 'ארץ ייצור' })).toContainText('טורקיה');
    await expect(page.getByText('יונדאי טורקיה')).toHaveCount(0);

    await expectAccessible(page);
  });

  test('flags what a buyer should check', async ({ page }) => {
    await page.goto(`/vehicle/${PLATES.volvo}`);
    await expect(page.getByRole('alert').filter({ hasText: 'ריקול פתוח' })).toBeVisible();

    const checklist = page.getByRole('region', { name: "צ'קליסט לקונה" });
    await expect(checklist).toContainText('2 נקודות לבדיקה');
    await expect(checklist).toContainText('הרכב היה רכב ליסינג.');
    await expect(page.locator('.price-card__importer')).toContainText('מאיר חברה למכוניות ומשאיות');
  });

  test('copies the VIN with visible confirmation', async ({ page, context, browserName }) => {
    test.skip(browserName !== 'chromium', 'clipboard permissions are Chromium-only here');
    await context.grantPermissions(['clipboard-read', 'clipboard-write']);
    await page.goto(`/vehicle/${PLATES.hyundai}`);

    await page.getByRole('button', { name: /מספר שלדה/ }).click();
    await expect(page.getByRole('status').filter({ hasText: 'הועתק מספר השלדה' })).toBeVisible();
    expect(await page.evaluate(() => navigator.clipboard.readText())).toBe('NLHA751AAGZ211845');
  });

  test('explains a plate that is not in the registry', async ({ page }) => {
    await page.goto(`/vehicle/${PLATES.unknown}`);
    await expect(page.getByRole('heading', { name: 'לא נמצא רכב' })).toBeVisible();
  });

  test('keeps the car identified after scrolling past the plate', async ({ page }) => {
    await page.goto(`/vehicle/${PLATES.volvo}`);
    await expect(page.getByRole('heading', { level: 2, name: 'וולבו XC60 B5 FWD' })).toBeVisible();
    await page.mouse.wheel(0, 1600);
    await expect(page.locator('.compact-bar__inner--visible')).toBeVisible();
  });
});
