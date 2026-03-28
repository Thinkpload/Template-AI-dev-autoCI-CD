import { test, expect } from '@playwright/test';

test.describe('Auth middleware redirect flow', () => {
  test('unauthenticated user is redirected from /dashboard to /sign-in', async ({ page }) => {
    // Clear cookies to ensure unauthenticated state
    await page.context().clearCookies();

    await page.goto('/dashboard');

    // Should be redirected to /sign-in
    await expect(page).toHaveURL(/\/sign-in/);
  });

  test('sign-in page is accessible without authentication', async ({ page }) => {
    await page.context().clearCookies();

    await page.goto('/sign-in');

    // Should stay on sign-in (not redirected)
    await expect(page).toHaveURL(/\/sign-in/);
    await expect(page.getByRole('heading', { name: /sign in/i })).toBeVisible();
  });

  test('sign-up page is accessible without authentication', async ({ page }) => {
    await page.context().clearCookies();

    await page.goto('/sign-up');

    await expect(page).toHaveURL(/\/sign-up/);
    await expect(page.getByRole('heading', { name: /create account/i })).toBeVisible();
  });

  test('sign-in form shows error on invalid credentials', async ({ page }) => {
    await page.context().clearCookies();

    await page.goto('/sign-in');

    await page.getByLabel(/email/i).fill('wrong@example.com');
    await page.getByLabel(/password/i).fill('wrongpassword');
    await page.getByRole('button', { name: /sign in/i }).click();

    await expect(page.getByRole('alert')).toBeVisible();
    await expect(page.getByRole('alert')).toContainText(/invalid credentials/i);
  });

  test('sign-in form shows validation error for short password', async ({ page }) => {
    await page.context().clearCookies();

    await page.goto('/sign-in');

    await page.getByLabel(/email/i).fill('test@example.com');
    await page.getByLabel(/password/i).fill('short');
    await page.getByRole('button', { name: /sign in/i }).click();

    await expect(page.getByText(/8 characters/i)).toBeVisible();
  });
});
