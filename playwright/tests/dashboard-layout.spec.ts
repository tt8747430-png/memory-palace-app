import { test, expect, devices } from '@playwright/test';

/**
 * Dashboard layout smoke tests — Phase 2A
 *
 * These tests verify the responsive shell renders correctly.
 * Auth-gated tests that need a real user session are marked with
 * `test.fixme()` until the auth fixture is implemented (Phase 3B).
 */

test.describe('Dashboard layout', () => {
  test('unauthenticated visit to / redirects to /login', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveURL(/\/login/);
  });

  test.describe('authenticated shell', () => {
    // TODO: Replace with auth fixture when available (Phase 3B)
    // These tests require a logged-in user session to see the dashboard shell.
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
