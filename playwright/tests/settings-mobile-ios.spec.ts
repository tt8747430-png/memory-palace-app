import { test, expect, devices } from '@playwright/test';

const iphone14pro = {
  ...devices['iPhone 14 Pro'],
  viewport: { width: 402, height: 874 },
};

test.use(iphone14pro);

test.describe('Settings — iPhone 14 Pro (402x874)', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    await page.getByLabel('Email').fill('brailacristian07@gmail.com');
    await page.getByRole('textbox', { name: 'Password' }).fill('74SUs-wTvk*6NF2');
    await page.getByRole('button', { name: /sign in/i }).click();
    await page.waitForURL(/\/(dashboard|palaces)/, { timeout: 15_000 });
  });

  test('renders without horizontal overflow and clears the bottom nav', async ({ page }) => {
    await page.goto('/settings/profile');
    await expect(page.getByRole('heading', { name: 'Settings', level: 1 })).toBeVisible();

    const docWidth = await page.evaluate(() => document.documentElement.scrollWidth);
    expect(docWidth).toBeLessThanOrEqual(402);

    const nav = page.getByRole('navigation', { name: /bottom navigation/i });
    const navBox = await nav.boundingBox();
    expect(navBox).not.toBeNull();

    const main = page.locator('main#main-content');
    const mainContentBottom = await main.evaluate((el) => {
      const cs = getComputedStyle(el);
      return el.getBoundingClientRect().top + el.clientHeight - parseFloat(cs.paddingBottom);
    });
    if (navBox) {
      expect(Math.abs(mainContentBottom - navBox.y)).toBeLessThanOrEqual(1);
    }
  });

  test('mobile pill nav switches between sections', async ({ page }) => {
    await page.goto('/settings/profile');
    const pillNav = page.getByRole('navigation', { name: /settings sections/i });
    await expect(pillNav).toBeVisible();

    await pillNav.getByRole('link', { name: /preferences/i }).click();
    await page.waitForURL('**/settings/preferences');
    await expect(page.getByRole('heading', { name: /theme/i })).toBeVisible();

    await pillNav.getByRole('link', { name: /data/i }).click();
    await page.waitForURL('**/settings/data');
    await expect(page.getByRole('heading', { name: /export/i })).toBeVisible();
  });
});
