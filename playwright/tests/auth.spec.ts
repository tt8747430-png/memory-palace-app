import { test, expect } from '@playwright/test';

test.describe('Auth pages', () => {
  test('login page renders the sign-in form', async ({ page }) => {
    await page.goto('/login');

    await expect(page).toHaveTitle(/Memory Palace/);
    await expect(page.getByRole('heading', { name: /welcome back/i })).toBeVisible();
    await expect(page.getByLabel('Email')).toBeVisible();
    await expect(page.getByLabel('Password')).toBeVisible();
    await expect(page.getByRole('button', { name: /sign in/i })).toBeVisible();
    await expect(page.getByRole('link', { name: /sign up/i })).toBeVisible();
  });

  test('signup page renders the create-account form', async ({ page }) => {
    await page.goto('/signup');

    await expect(page).toHaveTitle(/Memory Palace/);
    await expect(page.getByRole('heading', { name: /begin your palace/i })).toBeVisible();
    await expect(page.getByLabel('Email')).toBeVisible();
    await expect(page.getByLabel('Password')).toBeVisible();
    await expect(page.getByRole('button', { name: /create account/i })).toBeVisible();
    await expect(page.getByRole('link', { name: /sign in/i }).first()).toBeVisible();
  });

  test('login page sign-up link navigates to /signup', async ({ page }) => {
    await page.goto('/login');
    await page.getByRole('link', { name: /sign up/i }).click();
    await expect(page).toHaveURL(/\/signup/);
  });

  test('signup page sign-in link navigates to /login', async ({ page }) => {
    await page.goto('/signup');
    await page
      .getByRole('link', { name: /sign in/i })
      .first()
      .click();
    await expect(page).toHaveURL(/\/login/);
  });

  test('protected route redirects unauthenticated users to /login', async ({ page }) => {
    await page.goto('/palaces');

    await expect(page).toHaveURL(/\/login/);
  });
});
