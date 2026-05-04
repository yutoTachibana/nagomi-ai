import { test, expect } from '@playwright/test';

const BASE = 'http://localhost:3000';
const SS_DIR = 'screenshots';

async function ss(page: import('@playwright/test').Page, name: string) {
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(800);
  await page.screenshot({ path: `${SS_DIR}/${name}.png`, fullPage: true });
}

// ====================================================================
// 更新された画面 + 新規画面のスクリーンショット
// ====================================================================

test.describe('更新・新規画面', () => {
  test('01-ログイン画面', async ({ page }) => {
    await page.goto(`${BASE}/login`);
    await expect(page.locator('h1')).toContainText('こもれび');
    await ss(page, '01-login');
  });

  test('02-サインアップ画面', async ({ page }) => {
    await page.goto(`${BASE}/signup`);
    await expect(page.locator('h1')).toContainText('こもれび');
    await ss(page, '02-signup');
  });

  test('36-パスワードリセット画面', async ({ page }) => {
    await page.goto(`${BASE}/forgot-password`);
    await expect(page.locator('h1')).toBeVisible();
    await ss(page, '36-forgot-password');
  });

  test('37-利用規約', async ({ page }) => {
    await page.goto(`${BASE}/terms`);
    await ss(page, '37-terms');
  });

  test('38-プライバシーポリシー', async ({ page }) => {
    await page.goto(`${BASE}/privacy`);
    await ss(page, '38-privacy');
  });
});

test.describe('認証済み新規画面', () => {
  const EMAIL = 'chat-test@example.com';
  const PASSWORD = 'testtest123';

  test.beforeEach(async ({ page }) => {
    await page.goto(`${BASE}/login`);
    await page.fill('input[type="email"]', EMAIL);
    await page.fill('input[type="password"]', PASSWORD);
    // Click the specific login button (not OAuth buttons)
    await page.locator('form button[type="submit"]').click();
    await page.waitForURL(/\/(home|onboarding)/, { timeout: 15000 });
  });

  test('39-データの管理', async ({ page }) => {
    await page.goto(`${BASE}/mypage/data`);
    await page.waitForTimeout(500);
    await ss(page, '39-data-management');
  });

  test('28-マイページ (更新)', async ({ page }) => {
    await page.goto(`${BASE}/mypage`);
    await expect(page.locator('h1')).toBeVisible();
    await ss(page, '28-mypage');
  });

  test('40-ヘルスチェック', async ({ page }) => {
    const response = await page.goto(`${BASE}/api/health`);
    const body = await response?.json();
    test.expect(body?.status).toBe('ok');
  });
});
