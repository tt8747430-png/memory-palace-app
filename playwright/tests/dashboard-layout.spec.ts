import { test, expect, devices } from '@playwright/test';

test.describe('Dashboard layout', () => {
  test('unauthenticated visit to a protected route redirects to /login', async ({ page }) => {
    await page.goto('/dashboard');
    await expect(page).toHaveURL(/\/login/);
  });

  test.describe('authenticated shell', () => {
    test.fixme('desktop: renders sidebar and hides bottom nav', async ({ page }) => {
      await page.goto('/');
      const sidebar = page.locator('aside[aria-label="Main navigation"]');
      await expect(sidebar).toBeVisible();
      const bottomNav = page.locator('nav[aria-label="Bottom navigation"]');
      await expect(bottomNav).not.toBeVisible();
    });

    test.fixme('mobile: renders bottom nav and hides sidebar', async ({ browser }) => {
      const context = await browser.newContext({
        ...devices['Pixel 5'],
      });
      const page = await context.newPage();
      await page.goto('/');
      const bottomNav = page.locator('nav[aria-label="Bottom navigation"]');
      await expect(bottomNav).toBeVisible();
      const sidebar = page.locator('aside[aria-label="Main navigation"]');
      await expect(sidebar).not.toBeVisible();
      await context.close();
    });

    test.fixme('mobile: hamburger menu opens the sidebar drawer', async ({ browser }) => {
      const context = await browser.newContext({
        ...devices['Pixel 5'],
      });
      const page = await context.newPage();
      await page.goto('/');
      await page.getByRole('button', { name: /open navigation menu/i }).click();
      await expect(page.getByRole('dialog')).toBeVisible();
      await expect(page.locator('nav[aria-label="Main navigation"]')).toBeVisible();
      await context.close();
    });

    test.fixme('bottom nav has 5 tabs with correct labels', async ({ browser }) => {
      const context = await browser.newContext({
        ...devices['Pixel 5'],
      });
      const page = await context.newPage();
      await page.goto('/');
      const bottomNav = page.locator('nav[aria-label="Bottom navigation"]');
      await expect(bottomNav.getByText('Home')).toBeVisible();
      await expect(bottomNav.getByText('Daily')).toBeVisible();
      await expect(bottomNav.getByText('Games')).toBeVisible();
      await expect(bottomNav.getByText('Progress')).toBeVisible();
      await expect(bottomNav.getByText('Palaces')).toBeVisible();
      await context.close();
    });

    test.fixme('active tab on / is Home with aria-current="page"', async ({ page }) => {
      await page.goto('/');
      const homeLink = page.locator('nav[aria-label="Bottom navigation"] a[aria-current="page"]');
      await expect(homeLink).toHaveText(/Home/);
    });
  });
});
