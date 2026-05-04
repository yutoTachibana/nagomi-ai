import { test, expect } from '@playwright/test';

test.describe('Navigation', () => {
  // These tests assume unauthenticated - they verify public routes
  test('crisis page shows hotline numbers', async ({ page }) => {
    await page.goto('/crisis');
    await expect(page.locator('text=0120-279-338')).toBeVisible();
  });

  test('library articles are accessible', async ({ page }) => {
    // Library pages are static and don't require auth
    // Test that the build includes them
    const response = await page.goto('/library/what-is-anxiety');
    // May redirect to login, but page should exist (not 404)
    expect(response?.status()).not.toBe(404);
  });
});
