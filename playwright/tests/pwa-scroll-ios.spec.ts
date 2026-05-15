import { test, expect, devices } from '@playwright/test';

const iphone14pro = {
  ...devices['iPhone 14 Pro'],
  viewport: { width: 402, height: 874 },
};

test.use(iphone14pro);

test.describe('PWA iOS scroll bug — iPhone 14 Pro (402x874)', () => {
  test('html and body are non-scrollable; <main> is the only scroll container', async ({
    page,
  }) => {
    await page.goto('/login');

    const htmlOverflow = await page.evaluate(
      () => getComputedStyle(document.documentElement).overflow,
    );
    const bodyOverflow = await page.evaluate(() => getComputedStyle(document.body).overflow);
    expect(htmlOverflow).toBe('hidden');
    expect(bodyOverflow).toBe('hidden');

    const htmlHeight = await page.evaluate(() => document.documentElement.clientHeight);
    const bodyHeight = await page.evaluate(() => document.body.clientHeight);
    expect(htmlHeight).toBe(874);
    expect(bodyHeight).toBe(874);

    const docScrollable = await page.evaluate(
      () => document.documentElement.scrollHeight > document.documentElement.clientHeight,
    );
    expect(docScrollable).toBe(false);
  });

  test('command palette: scroll lock + BottomNav at viewport bottom, no over-scroll white space', async ({
    page,
  }) => {
    await page.goto('/login');
    await page.getByLabel('Email').fill('brailacristian07@gmail.com');
    await page.getByRole('textbox', { name: 'Password' }).fill('74SUs-wTvk*6NF2');
    await page.getByRole('button', { name: /sign in/i }).click();
    await page.waitForURL(/\/(dashboard|palaces)/, { timeout: 15_000 });

    const main = page.locator('main#main-content');
    await expect(main).toHaveCSS('overflow-y', 'auto');
    await expect(main).toHaveCSS('overscroll-behavior-y', 'contain');

    const nav = page.getByRole('navigation', { name: /bottom navigation/i });
    const navBox = await nav.boundingBox();
    expect(navBox).not.toBeNull();
    if (navBox) {
      expect(navBox.y + navBox.height).toBe(874);
      expect(navBox.height).toBeLessThanOrEqual(64);
    }

    const beforeScroll = await main.evaluate((el) => el.scrollTop);

    await page.getByRole('button', { name: /open command palette/i }).click();
    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible();

    await expect
      .poll(async () => page.evaluate(() => document.body.hasAttribute('data-scroll-locked')))
      .toBe(true);

    await main.evaluate((el) => el.scrollBy(0, 9999));
    const duringLockScroll = await main.evaluate((el) => el.scrollTop);
    expect(duringLockScroll).toBe(beforeScroll);

    await page.keyboard.press('Escape');
    await expect(dialog).toBeHidden();

    await expect(nav).toBeVisible();
    const navBoxAfter = await nav.boundingBox();
    if (navBoxAfter) {
      expect(navBoxAfter.y + navBoxAfter.height).toBe(874);
      expect(navBoxAfter.height).toBeLessThanOrEqual(64);
    }

    const maxScrollTop = await main.evaluate((el) => el.scrollHeight - el.clientHeight);
    const afterScroll = await main.evaluate((el) => el.scrollTop);
    expect(afterScroll).toBeLessThanOrEqual(Math.max(0, maxScrollTop));
  });
});
