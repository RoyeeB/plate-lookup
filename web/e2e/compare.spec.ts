import { test, expect, expectAccessible } from './support';
import { PLATES } from './fixtures';

test('compares two cars chosen from recent searches', async ({ page }) => {
  // Visit the Volvo first so it's in recent searches.
  await page.goto(`/vehicle/${PLATES.volvo}`);
  await expect(page.getByRole('heading', { level: 2, name: 'וולבו XC60 B5 FWD' })).toBeVisible();

  await page.goto(`/vehicle/${PLATES.hyundai}`);
  await page.getByRole('button', { name: 'השוואה לרכב אחר' }).click();
  const picker = page.getByRole('dialog', { name: 'לאיזה רכב להשוות?' });
  await picker.getByRole('button', { name: /וולבו XC60 B5 FWD/ }).click();

  await expect(page).toHaveURL(`/compare/${PLATES.hyundai}/${PLATES.volvo}`);
  const table = page.getByRole('table', { name: 'השוואת רכבים' });
  const yearRow = table.getByRole('row').filter({ has: page.getByRole('rowheader', { name: 'שנת ייצור' }) });
  await expect(yearRow).toContainText('2016');
  await expect(yearRow).toContainText('2021');
  await expect(table.getByRole('row').filter({ hasText: 'נקודות לבדיקה' })).toContainText('2');

  await expectAccessible(page);
});
