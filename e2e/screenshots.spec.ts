import { test, expect } from '@playwright/test';

const BASE = 'http://localhost:3000';
const SS_DIR = 'screenshots';

// Helper: take a full-page screenshot with a mobile viewport
async function ss(page: import('@playwright/test').Page, name: string) {
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(500); // let animations settle
  await page.screenshot({ path: `${SS_DIR}/${name}.png`, fullPage: true });
}

// ====================================================================
// 1. 未認証シナリオ
// ====================================================================
test.describe('未認証', () => {
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

  test('03-緊急サポート画面', async ({ page }) => {
    await page.goto(`${BASE}/crisis`);
    await expect(page.locator('text=0120-279-338')).toBeVisible();
    await ss(page, '03-crisis');
  });

  test('04-未認証リダイレクト', async ({ page }) => {
    await page.goto(`${BASE}/home`);
    await expect(page).toHaveURL(/\/login/);
    await ss(page, '04-unauth-redirect');
  });
});

// ====================================================================
// 2. サインアップ→オンボーディングフロー
// ====================================================================
test.describe('サインアップフロー', () => {
  const email = `ss-test-${Date.now()}@example.com`;
  const password = 'testtest123';

  test('05-サインアップ実行', async ({ page }) => {
    await page.goto(`${BASE}/signup`);
    await page.fill('input[type="email"]', email);
    await page.fill('input[type="password"]', password);
    await ss(page, '05-signup-filled');

    await page.click('button[type="submit"]');
    await page.waitForURL(/\/onboarding/, { timeout: 10000 });
    await ss(page, '06-onboarding-step1');
  });

  test('07-オンボーディング全ステップ', async ({ page }) => {
    // Login first
    await page.goto(`${BASE}/login`);
    await page.fill('input[type="email"]', email);
    await page.fill('input[type="password"]', password);
    await page.click('button[type="submit"]');
    await page.waitForURL(/\/(home|onboarding)/, { timeout: 10000 });

    // If redirected to home (already onboarded), navigate to check
    if (page.url().includes('/home')) {
      // Already passed onboarding in previous test
      await ss(page, '07-already-home');
      return;
    }

    // Step 1: Name
    await page.fill('input[placeholder="ニックネーム"]', 'テストさん');
    await ss(page, '07-onboarding-name');
    await page.locator('button:has-text("次へ")').first().click();
    await page.waitForTimeout(500);

    // Step 2: Diagnosis
    await ss(page, '08-onboarding-diagnosis');
    await page.locator('button:has-text("次へ")').first().click();
    await page.waitForTimeout(500);

    // Step 3: Promise
    await ss(page, '09-onboarding-promise');
    await page.locator('button:has-text("はじめる")').click();
    await page.waitForURL(/\/home/, { timeout: 10000 });
    await ss(page, '10-onboarding-complete-home');
  });
});

// ====================================================================
// 3. 認証済みシナリオ (全ページ)
// ====================================================================
test.describe('認証済みページ', () => {
  // Use a dedicated test user
  const email = `pages-${Date.now()}@example.com`;
  const password = 'testtest123';

  test.beforeAll(async ({ request }) => {
    // Create user via API
    await request.post(`${BASE}/api/auth/signup`, {
      data: { email, password },
    });
  });

  // Login before each test
  test.beforeEach(async ({ page }) => {
    await page.goto(`${BASE}/login`);
    await page.fill('input[type="email"]', email);
    await page.fill('input[type="password"]', password);
    await page.click('button[type="submit"]');
    await page.waitForURL(/\/(home|onboarding)/, { timeout: 10000 });

    // Complete onboarding if needed
    if (page.url().includes('/onboarding')) {
      await page.locator('button:has-text("次へ"), button:has-text("スキップ")').first().click();
      await page.waitForTimeout(300);
      await page.locator('button:has-text("次へ"), button:has-text("スキップ")').first().click();
      await page.waitForTimeout(300);
      await page.locator('button:has-text("はじめる")').click();
      await page.waitForURL(/\/home/, { timeout: 10000 });
    }
  });

  test('11-ホーム画面', async ({ page }) => {
    await page.goto(`${BASE}/home`);
    await expect(page.locator('h1')).toBeVisible();
    await ss(page, '11-home');
  });

  test('12-記録ハブ', async ({ page }) => {
    await page.goto(`${BASE}/record`);
    await expect(page.locator('h1')).toContainText('記録する');
    await ss(page, '12-record-hub');
  });

  test('13-気分記録', async ({ page }) => {
    await page.goto(`${BASE}/record/mood`);
    await expect(page.locator('h1')).toContainText('気分を記録する');
    await ss(page, '13-mood-entry');
  });

  test('14-気分記録を保存', async ({ page }) => {
    await page.goto(`${BASE}/record/mood`);
    await page.waitForTimeout(500);
    // Click save button
    await page.locator('button:has-text("記録する")').click();
    await page.waitForURL(/\/home/, { timeout: 10000 });
    await ss(page, '14-mood-saved-home');
  });

  test('15-CBTコラム法', async ({ page }) => {
    await page.goto(`${BASE}/record/thought`);
    await page.waitForLoadState('networkidle');
    await ss(page, '15-thought-record');
  });

  test('16-ジャーナル', async ({ page }) => {
    await page.goto(`${BASE}/record/journal`);
    await expect(page.locator('h1')).toContainText('ジャーナル');
    await ss(page, '16-journal');
  });

  test('17-ことね(AIチャット)', async ({ page }) => {
    await page.goto(`${BASE}/kotone`);
    await expect(page.locator('h1, [class*="font-mincho"]').first()).toBeVisible();
    await ss(page, '17-kotone');
  });

  test('18-みつめる(insights)', async ({ page }) => {
    await page.goto(`${BASE}/insights`);
    await expect(page.locator('h1')).toContainText('みつめる');
    await ss(page, '18-insights');
  });

  test('19-呼吸を整える(mindfulness)', async ({ page }) => {
    await page.goto(`${BASE}/mindfulness`);
    await expect(page.locator('h1')).toContainText('呼吸を整える');
    await ss(page, '19-mindfulness');
  });

  test('20-読みもの一覧(library)', async ({ page }) => {
    await page.goto(`${BASE}/library`);
    await expect(page.locator('h1')).toContainText('読みもの');
    await ss(page, '20-library-index');
  });

  test('21-記事: 不安って何だろう', async ({ page }) => {
    await page.goto(`${BASE}/library/what-is-anxiety`);
    await expect(page.locator('h1')).toContainText('不安');
    await ss(page, '21-library-anxiety');
  });

  test('22-記事: 適応障害', async ({ page }) => {
    await page.goto(`${BASE}/library/adjustment-disorder`);
    await ss(page, '22-library-adjustment');
  });

  test('23-記事: 双極性障害', async ({ page }) => {
    await page.goto(`${BASE}/library/bipolar-long-journey`);
    await ss(page, '23-library-bipolar');
  });

  test('24-記事: 認知の歪み', async ({ page }) => {
    await page.goto(`${BASE}/library/cognitive-distortions`);
    await ss(page, '24-library-distortions');
  });

  test('25-記事: 薬を飲むこと', async ({ page }) => {
    await page.goto(`${BASE}/library/about-medication`);
    await ss(page, '25-library-medication');
  });

  test('26-服薬の記録', async ({ page }) => {
    await page.goto(`${BASE}/medication`);
    await expect(page.locator('h1')).toContainText('服薬');
    await ss(page, '26-medication');
  });

  test('27-コミュニティ', async ({ page }) => {
    await page.goto(`${BASE}/community`);
    await expect(page.locator('h1')).toContainText('コミュニティ');
    await ss(page, '27-community');
  });

  test('28-マイページ', async ({ page }) => {
    await page.goto(`${BASE}/mypage`);
    await expect(page.locator('h1')).toBeVisible();
    await ss(page, '28-mypage');
  });
});
