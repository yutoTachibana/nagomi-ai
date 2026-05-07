/**
 * 1 つのブラウザコンテキストで全画面のスクリーンショットを取る.
 * - サインアップを 1 回だけ (レート制限回避)
 * - すべてのページを同じセッションで巡回
 *
 * 使い方:
 *   BASE_URL=https://kn3zrjwqry.ap-northeast-1.awsapprunner.com node scripts/screenshots-batch.js
 *   (省略時は http://localhost:3000)
 */

const { chromium } = require('playwright');

const BASE = process.env.BASE_URL ?? 'http://localhost:3000';
const SS_DIR = 'screenshots';
const EMAIL = process.env.SS_EMAIL ?? `screenshot-${Date.now()}@example.com`;
const PASSWORD = process.env.SS_PASSWORD ?? 'testtest123';
const VIEWPORT = { width: 390, height: 844 };

async function ss(page, name, opts = {}) {
  await page.waitForLoadState('networkidle').catch(() => {});
  await page.waitForTimeout(opts.wait ?? 700);
  await page.screenshot({ path: `${SS_DIR}/${name}.png`, fullPage: true });
  console.log(`  ✓ ${name}`);
}

async function setup(context) {
  const page = await context.newPage();

  console.log('Logging in:', EMAIL);
  await page.goto(`${BASE}/login`);
  await page.fill('input[type="email"]', EMAIL);
  await page.fill('input[type="password"]', PASSWORD);
  await page.locator('form button[type="submit"]').click();
  await page.waitForURL(/\/(home|onboarding)/, { timeout: 30000 });

  if (page.url().includes('/onboarding')) {
    console.log('Skipping onboarding...');
    for (let i = 0; i < 6; i++) {
      const next = page.locator('button', { hasText: /スキップ|次へ|始める|はじめる/ }).first();
      if (await next.isVisible().catch(() => false)) {
        await next.click();
        await page.waitForTimeout(400);
      } else break;
    }
    if (page.url().includes('/onboarding')) {
      await page.goto(`${BASE}/home`);
    }
  }

  console.log('Auth ready at:', page.url());
  return page;
}

async function main() {
  console.log(`Base URL: ${BASE}`);
  const browser = await chromium.launch();
  const context = await browser.newContext({
    viewport: VIEWPORT,
    deviceScaleFactor: 2,
    ignoreHTTPSErrors: true,
  });

  try {
    const page = await setup(context);

    // ---- Public pages (no auth needed, but can also access while logged in) ----
    console.log('\nPublic pages:');
    // Skipping login/signup as those require unauth state

    // ---- Authenticated pages ----
    console.log('\nAuthenticated pages:');

    await page.goto(`${BASE}/home`);
    await ss(page, '58-home-with-nagomi');

    await page.goto(`${BASE}/record`);
    await ss(page, '40-record-hub-updated');

    await page.goto(`${BASE}/record/sleep`);
    await ss(page, '41-sleep-empty');
    // Fill the form and capture again
    try {
      await page.locator('input[type="time"]').first().fill('23:30');
      await page.locator('input[type="time"]').nth(1).fill('07:00');
      await page.locator('button', { hasText: 'よく眠れた' }).first().click();
      await page.waitForTimeout(300);
      await ss(page, '42-sleep-filled');
    } catch (e) {
      console.warn('  ! sleep filled failed:', e.message);
    }

    await page.goto(`${BASE}/record/thought`);
    await ss(page, '43-thought-list');

    await page.goto(`${BASE}/record/checkup`);
    await ss(page, '44-checkup-home');
    // Click first start button
    try {
      const start = page.locator('button', { hasText: /はじめてみる/ }).first();
      if (await start.isVisible().catch(() => false)) {
        await start.click();
        await page.waitForTimeout(700);
        await ss(page, '45-checkup-question');
      }
    } catch (e) {
      console.warn('  ! checkup question failed:', e.message);
    }

    await page.goto(`${BASE}/record/cycle`);
    await ss(page, '46-cycle-optin');
    try {
      const enable = page.locator('button', { hasText: 'サイクル記録を始める' });
      if (await enable.isVisible().catch(() => false)) {
        await enable.click();
        await page.waitForTimeout(1500);
      }
      await ss(page, '47-cycle-enabled');
    } catch (e) {
      console.warn('  ! cycle enable failed:', e.message);
    }

    await page.goto(`${BASE}/medication`);
    await ss(page, '48-medication-with-side-effects');

    await page.goto(`${BASE}/medication/side-effects`);
    await ss(page, '49-side-effects-list');
    try {
      const addBtn = page.locator('button', { hasText: '気になることを記録' });
      if (await addBtn.isVisible().catch(() => false)) {
        await addBtn.click();
        await page.waitForTimeout(500);
        await ss(page, '50-side-effects-form');
      }
    } catch (e) {
      console.warn('  ! side effects form failed:', e.message);
    }

    await page.goto(`${BASE}/crisis`);
    await ss(page, '51-crisis-with-plan-link');

    await page.goto(`${BASE}/crisis/plan`);
    await ss(page, '52-safety-plan-empty');

    await page.goto(`${BASE}/mypage`);
    await ss(page, '53-mypage-with-report');

    await page.goto(`${BASE}/mypage/report`);
    await ss(page, '54-doctor-report');

    await page.goto(`${BASE}/mypage/settings`);
    await ss(page, '55-settings-with-name');

    await page.goto(`${BASE}/insights`);
    await ss(page, '56-insights-with-extras');

    await page.goto(`${BASE}/kotone`);
    await ss(page, '57-nagomi-chat');

    console.log('\nAll done.');
  } catch (err) {
    console.error('Failed:', err);
    process.exitCode = 1;
  } finally {
    await browser.close();
  }
}

main();
