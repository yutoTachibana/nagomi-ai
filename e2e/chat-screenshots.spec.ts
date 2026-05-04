import { test, expect } from '@playwright/test';

const BASE = 'http://localhost:3000';
const SS_DIR = 'screenshots';
const EMAIL = 'chat-test@example.com';
const PASSWORD = 'testtest123';

async function ss(page: import('@playwright/test').Page, name: string) {
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(800);
  await page.screenshot({ path: `${SS_DIR}/${name}.png`, fullPage: true });
}

async function login(page: import('@playwright/test').Page) {
  await page.goto(`${BASE}/login`);
  await page.fill('input[type="email"]', EMAIL);
  await page.fill('input[type="password"]', PASSWORD);
  await page.click('button[type="submit"]');
  await page.waitForURL(/\/(home|onboarding)/, { timeout: 10000 });
  if (page.url().includes('/onboarding')) {
    // Skip onboarding
    for (let i = 0; i < 2; i++) {
      await page.locator('button:has-text("次へ"), button:has-text("スキップ")').first().click();
      await page.waitForTimeout(400);
    }
    await page.locator('button:has-text("はじめる")').click();
    await page.waitForURL(/\/home/, { timeout: 10000 });
  }
}

test.describe('ことねチャット機能', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test('30-ことね: 直近の会話を自動で再開', async ({ page }) => {
    await page.goto(`${BASE}/kotone`);
    await page.waitForTimeout(1500);
    // Should auto-load the most recent conversation (猫カフェ)
    await ss(page, '30-kotone-resume-latest');
  });

  test('31-ことね: 会話一覧を表示', async ({ page }) => {
    await page.goto(`${BASE}/kotone`);
    await page.waitForTimeout(1000);
    // Click the list icon to show conversation list
    const listButton = page.locator('button[aria-label="会話一覧"], a[aria-label="会話一覧"]').first();
    if (await listButton.isVisible()) {
      await listButton.click();
    } else {
      // Try finding by icon
      await page.locator('button:has(svg), a:has(svg)').filter({ hasText: '' }).first().click();
    }
    await page.waitForTimeout(800);
    await ss(page, '31-kotone-thread-list');
  });

  test('32-ことね: 仕事のストレスの会話を再開', async ({ page }) => {
    await page.goto(`${BASE}/kotone`);
    await page.waitForTimeout(1000);
    // Open thread list
    const listButton = page.locator('[aria-label="会話一覧"]').first();
    if (await listButton.isVisible()) {
      await listButton.click();
      await page.waitForTimeout(500);
    }
    // Click on "仕事のストレスについて"
    const workThread = page.locator('text=仕事のストレス');
    if (await workThread.isVisible()) {
      await workThread.click();
      await page.waitForTimeout(1500);
    }
    await ss(page, '32-kotone-work-stress-thread');
  });

  test('33-ことね: 眠れない夜の会話を再開', async ({ page }) => {
    await page.goto(`${BASE}/kotone`);
    await page.waitForTimeout(1000);
    const listButton = page.locator('[aria-label="会話一覧"]').first();
    if (await listButton.isVisible()) {
      await listButton.click();
      await page.waitForTimeout(500);
    }
    const sleepThread = page.locator('text=眠れない夜');
    if (await sleepThread.isVisible()) {
      await sleepThread.click();
      await page.waitForTimeout(1500);
    }
    await ss(page, '33-kotone-sleepless-thread');
  });

  test('34-ことね: 新しい会話を開始', async ({ page }) => {
    await page.goto(`${BASE}/kotone`);
    await page.waitForTimeout(1000);
    const listButton = page.locator('[aria-label="会話一覧"]').first();
    if (await listButton.isVisible()) {
      await listButton.click();
      await page.waitForTimeout(500);
    }
    const newConvButton = page.locator('button:has-text("新しい会話")');
    if (await newConvButton.isVisible()) {
      await newConvButton.click();
      await page.waitForTimeout(800);
    }
    await ss(page, '34-kotone-new-conversation');
  });

  test('35-ことねノート: ユーザーコンテキスト一覧', async ({ page }) => {
    await page.goto(`${BASE}/kotone/note`);
    await page.waitForTimeout(1500);
    await ss(page, '35-kotone-note');
  });
});
