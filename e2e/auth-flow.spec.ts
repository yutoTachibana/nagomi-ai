import { test, expect } from '@playwright/test';

test.describe('Authentication flow', () => {
  test('redirects unauthenticated user to login', async ({ page }) => {
    await page.goto('/home');
    await expect(page).toHaveURL(/\/login/);
  });

  test('login page renders correctly', async ({ page }) => {
    await page.goto('/login');
    await expect(page.locator('h1')).toBeVisible();
  });

  test('signup page renders correctly', async ({ page }) => {
    await page.goto('/signup');
    await expect(page.locator('h1')).toBeVisible();
  });

  test('crisis page is accessible without auth', async ({ page }) => {
    await page.goto('/crisis');
    await expect(page.locator('h1')).toContainText('緊急');
  });
});
