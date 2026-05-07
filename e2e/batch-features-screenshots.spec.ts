import { test, expect } from '@playwright/test';

const BASE = process.env.BASE_URL ?? 'http://localhost:3000';
const SS_DIR = 'screenshots';

test.use({ ignoreHTTPSErrors: true });

const EMAIL = `screenshot-batch-${Date.now()}@example.com`;
const PASSWORD = 'testtest123';

async function ss(page: import('@playwright/test').Page, name: string) {
  await page.waitForLoadState('networkidle').catch(() => {});
  await page.waitForTimeout(600);
  await page.screenshot({ path: `${SS_DIR}/${name}.png`, fullPage: true });
}

async function signupAndLogin(page: import('@playwright/test').Page) {
  await page.goto(`${BASE}/signup`);
  await page.fill('input[type="email"]', EMAIL);
  // signup form has password + confirm password
  const passwordInputs = page.locator('input[type="password"]');
  await passwordInputs.nth(0).fill(PASSWORD);
  if (await passwordInputs.count() > 1) {
    await passwordInputs.nth(1).fill(PASSWORD);
  }
  await page.locator('form button[type="submit"]').click();
  // After signup, may redirect to login or onboarding
  await page.waitForURL(/\/(login|onboarding|home)/, { timeout: 15000 });

  if (page.url().includes('/login')) {
    // Login with the just-created credentials
    await page.fill('input[type="email"]', EMAIL);
    await page.fill('input[type="password"]', PASSWORD);
    await page.locator('form button[type="submit"]').click();
    await page.waitForURL(/\/(home|onboarding)/, { timeout: 15000 });
  }

  // Skip onboarding if shown
  if (page.url().includes('/onboarding')) {
    // Click through skip / next
    for (let i = 0; i < 5; i++) {
      const skip = page.locator('button', { hasText: /スキップ|次へ|始める|はじめる/ }).first();
      if (await skip.isVisible().catch(() => false)) {
        await skip.click();
        await page.waitForTimeout(500);
      } else {
        break;
      }
    }
    if (page.url().includes('/onboarding')) {
      await page.goto(`${BASE}/home`);
    }
  }
}

test.describe('バッチ追加機能のスクリーンショット', () => {
  test.beforeEach(async ({ page }) => {
    await signupAndLogin(page);
  });

  test('40-記録ハブ (新メニュー含む)', async ({ page }) => {
    await page.goto(`${BASE}/record`);
    await ss(page, '40-record-hub-updated');
  });

  test('41-睡眠の記録', async ({ page }) => {
    await page.goto(`${BASE}/record/sleep`);
    await ss(page, '41-sleep-empty');

    // Fill and capture
    await page.locator('input[type="time"]').first().fill('23:30');
    await page.locator('input[type="time"]').nth(1).fill('07:00');
    // Click quality 4
    await page.locator('button', { hasText: 'よく眠れた' }).first().click();
    await page.waitForTimeout(300);
    await ss(page, '42-sleep-filled');
  });

  test('43-思考の整理 (CBT) 一覧', async ({ page }) => {
    await page.goto(`${BASE}/record/thought`);
    await ss(page, '43-thought-list');
  });

  test('44-セルフチェック ホーム', async ({ page }) => {
    await page.goto(`${BASE}/record/checkup`);
    await ss(page, '44-checkup-home');
  });

  test('45-PHQ-9 質問画面', async ({ page }) => {
    await page.goto(`${BASE}/record/checkup`);
    await page.waitForTimeout(500);
    // Find first PHQ-9 start button
    const buttons = page.locator('button', { hasText: /はじめてみる|今日また確認する/ });
    if (await buttons.count() > 0) {
      await buttons.first().click();
      await page.waitForTimeout(700);
      await ss(page, '45-checkup-question');
    }
  });

  test('46-月経サイクル opt-in', async ({ page }) => {
    await page.goto(`${BASE}/record/cycle`);
    await ss(page, '46-cycle-optin');
  });

  test('47-月経サイクル 有効化後', async ({ page }) => {
    await page.goto(`${BASE}/record/cycle`);
    await page.waitForTimeout(500);
    const enableBtn = page.locator('button', { hasText: 'サイクル記録を始める' });
    if (await enableBtn.isVisible().catch(() => false)) {
      await enableBtn.click();
      await page.waitForTimeout(1500);
    }
    await ss(page, '47-cycle-enabled');
  });

  test('48-服薬の記録 (副作用リンク含む)', async ({ page }) => {
    await page.goto(`${BASE}/medication`);
    await ss(page, '48-medication-with-side-effects');
  });

  test('49-副作用 (気になることの) 記録 一覧', async ({ page }) => {
    await page.goto(`${BASE}/medication/side-effects`);
    await ss(page, '49-side-effects-list');
  });

  test('50-副作用 入力フォーム', async ({ page }) => {
    await page.goto(`${BASE}/medication/side-effects`);
    await page.waitForTimeout(500);
    const addBtn = page.locator('button', { hasText: '気になることを記録' });
    if (await addBtn.isVisible().catch(() => false)) {
      await addBtn.click();
      await page.waitForTimeout(500);
      await ss(page, '50-side-effects-form');
    }
  });

  test('51-緊急サポート (セーフティプラン導線含む)', async ({ page }) => {
    await page.goto(`${BASE}/crisis`);
    await ss(page, '51-crisis-with-plan-link');
  });

  test('52-セーフティプラン 編集モード', async ({ page }) => {
    await page.goto(`${BASE}/crisis/plan`);
    await ss(page, '52-safety-plan-empty');
  });

  test('53-マイページ (主治医レポート含む)', async ({ page }) => {
    await page.goto(`${BASE}/mypage`);
    await ss(page, '53-mypage-with-report');
  });

  test('54-主治医共有レポート', async ({ page }) => {
    await page.goto(`${BASE}/mypage/report`);
    await ss(page, '54-doctor-report');
  });

  test('55-設定 (表示名変更 + フォントサイズ)', async ({ page }) => {
    await page.goto(`${BASE}/mypage/settings`);
    await ss(page, '55-settings-with-name');
  });

  test('56-みつめる (パターン気づき + 睡眠 + サイクル)', async ({ page }) => {
    await page.goto(`${BASE}/insights`);
    await ss(page, '56-insights-with-extras');
  });
});

test.describe('なごみチャット (旧ことね)', () => {
  test.beforeEach(async ({ page }) => {
    await signupAndLogin(page);
  });

  test('57-なごみチャット (新ペルソナ名)', async ({ page }) => {
    await page.goto(`${BASE}/kotone`);
    await ss(page, '57-nagomi-chat');
  });

  test('58-ホーム画面 (ショートカット名「なごみと話す」)', async ({ page }) => {
    await page.goto(`${BASE}/home`);
    await ss(page, '58-home-with-nagomi');
  });
});
