import { test, expect } from '@playwright/test';

test.describe('Dashboard shell and navigation', () => {
  test('unauthenticated user is redirected from /dashboard to /sign-in', async ({ page }) => {
    await page.context().clearCookies();
    await page.goto('/dashboard');
    await expect(page).toHaveURL(/\/sign-in/);
  });

  test('dashboard page shows sidebar navigation on desktop', async ({ page }) => {
    // Set session cookie to simulate authenticated state
    await page.context().addCookies([
      {
        name: 'better-auth.session_token',
        value: 'mock-session-token',
        domain: 'localhost',
        path: '/',
      },
    ]);

    await page.goto('/dashboard');

    // Sidebar nav should be visible on desktop (lg+)
    await expect(page.getByRole('navigation', { name: /main navigation/i })).toBeVisible();
  });

  test('dashboard page shows breadcrumb in header', async ({ page }) => {
    await page.context().addCookies([
      {
        name: 'better-auth.session_token',
        value: 'mock-session-token',
        domain: 'localhost',
        path: '/',
      },
    ]);

    await page.goto('/dashboard');

    await expect(page.getByRole('navigation', { name: /breadcrumb/i })).toBeVisible();
    await expect(page.getByText('Dashboard')).toBeVisible();
  });

  test('dashboard index shows empty state with Get started CTA', async ({ page }) => {
    await page.context().addCookies([
      {
        name: 'better-auth.session_token',
        value: 'mock-session-token',
        domain: 'localhost',
        path: '/',
      },
    ]);

    await page.goto('/dashboard');

    await expect(page.getByRole('heading', { name: /welcome to your dashboard/i })).toBeVisible();
    await expect(page.getByRole('link', { name: /get started/i })).toBeVisible();
  });

  test('mobile hamburger button is visible on small viewport', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.context().addCookies([
      {
        name: 'better-auth.session_token',
        value: 'mock-session-token',
        domain: 'localhost',
        path: '/',
      },
    ]);

    await page.goto('/dashboard');

    await expect(page.getByRole('button', { name: /open navigation menu/i })).toBeVisible();
  });

  test('mobile sheet opens when hamburger is clicked', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.context().addCookies([
      {
        name: 'better-auth.session_token',
        value: 'mock-session-token',
        domain: 'localhost',
        path: '/',
      },
    ]);

    await page.goto('/dashboard');

    await page.getByRole('button', { name: /open navigation menu/i }).click();

    // Sheet slides in — look for the nav items inside it
    await expect(page.getByText('Dashboard')).toBeVisible();
    await expect(page.getByText('Settings')).toBeVisible();
  });
});
