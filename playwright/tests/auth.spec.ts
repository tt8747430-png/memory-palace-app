import { test, expect } from '@playwright/test';

/**
 * Auth smoke tests — Phase 1C
 *
 * These tests verify that the login and signup pages render correctly
 * without requiring real Supabase user credentials. They still assume
 * NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY are configured,
 * and act as the CI smoke gate that proves the build is serving valid HTML.
 */

test.describe('Auth pages', () => {
  test('login page renders the sign-in form', async ({ page }) => {
    await page.goto('/login');

    await expect(page).toHaveTitle(/Memory Palace/);
    await expect(page.getByRole('heading', { name: /welcome back/i })).toBeVisible();
    await expect(page.getByPlaceholder('Email')).toBeVisible();
    await expect(page.getByPlaceholder('Password')).toBeVisible();
    await expect(page.getByRole('button', { name: /sign in/i })).toBeVisible();
    await expect(page.getByRole('link', { name: /sign up/i })).toBeVisible();
  });

  test('signup page renders the create-account form', async ({ page }) => {
    await page.goto('/signup');

    await expect(page).toHaveTitle(/Memory Palace/);
    await expect(page.getByRole('heading', { name: /create account/i })).toBeVisible();
    await expect(page.getByPlaceholder('Email')).toBeVisible();
    await expect(page.getByPlaceholder('Password')).toBeVisible();
    await expect(page.getByRole('button', { name: /create account/i })).toBeVisible();
    await expect(page.getByRole('link', { name: /sign in/i })).toBeVisible();
  });

  test('login page sign-up link navigates to /signup', async ({ page }) => {
    await page.goto('/login');
    await page.getByRole('link', { name: /sign up/i }).click();
    await expect(page).toHaveURL(/\/signup/);
  });

  test('signup page sign-in link navigates to /login', async ({ page }) => {
    await page.goto('/signup');
    await page.getByRole('link', { name: /sign in/i }).click();
    await expect(page).toHaveURL(/\/login/);
  });

  test('protected route redirects unauthenticated users to /login', async ({ page }) => {
    await page.goto('/palaces');
    // proxy.ts redirects any protected route to /login when no Supabase session exists
    await expect(page).toHaveURL(/\/login/);
  });
});
