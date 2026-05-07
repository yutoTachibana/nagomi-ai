/**
 * 全画面のスクリーンショットを取り直す.
 * - サインアップ済みのテストユーザーでログインしてから巡回 (レート制限回避)
 * - 「なごみ」改名後の最新 UI を反映
 *
 * 使い方:
 *   SS_EMAIL=xxx SS_PASSWORD=yyy BASE_URL=... node scripts/screenshots-batch.js
 */

const { chromium } = require('playwright');

const BASE = process.env.BASE_URL ?? 'http://localhost:3000';
const SS_DIR = 'screenshots';
const EMAIL = process.env.SS_EMAIL;
const PASSWORD = process.env.SS_PASSWORD;
const VIEWPORT = { width: 390, height: 844 };

if (!EMAIL || !PASSWORD) {
  console.error('SS_EMAIL と SS_PASSWORD が必要です');
  process.exit(1);
}

async function ss(page, name, opts = {}) {
  await page.waitForLoadState('networkidle').catch(() => {});
  await page.waitForTimeout(opts.wait ?? 700);
  await page.screenshot({ path: `${SS_DIR}/${name}.png`, fullPage: true });
  console.log(`  ✓ ${name}`);
}

async function main() {
  console.log(`Base URL: ${BASE}`);
  const browser = await chromium.launch();

  // ---- 未認証コンテキスト ----
  const guestCtx = await browser.newContext({
    viewport: VIEWPORT,
    deviceScaleFactor: 2,
    ignoreHTTPSErrors: true,
  });

  try {
    console.log('\n== 未認証ページ ==');
    const guest = await guestCtx.newPage();

    await guest.goto(`${BASE}/login`);
    await ss(guest, '01-login');

    await guest.goto(`${BASE}/signup`);
    await ss(guest, '02-signup');

    // signup with filled form (not submitted)
    await guest.fill('input[type="email"]', 'someone@example.com');
    const pw = guest.locator('input[type="password"]');
    await pw.nth(0).fill('mypassword123');
    if (await pw.count() > 1) await pw.nth(1).fill('mypassword123');
    await ss(guest, '05-signup-filled');

    await guest.goto(`${BASE}/crisis`);
    await ss(guest, '03-crisis');

    // unauth redirect: try /home → /login
    await guest.goto(`${BASE}/home`);
    await guest.waitForURL(/\/login/, { timeout: 10000 });
    await ss(guest, '04-unauth-redirect');

    await guest.goto(`${BASE}/forgot-password`);
    await ss(guest, '36-forgot-password');

    await guest.goto(`${BASE}/terms`);
    await ss(guest, '37-terms');

    await guest.goto(`${BASE}/privacy`);
    await ss(guest, '38-privacy');
  } finally {
    await guestCtx.close();
  }

  // ---- 認証コンテキスト ----
  const ctx = await browser.newContext({
    viewport: VIEWPORT,
    deviceScaleFactor: 2,
    ignoreHTTPSErrors: true,
  });

  try {
    const page = await ctx.newPage();

    console.log('\n== ログイン ==');
    console.log('Logging in:', EMAIL);
    await page.goto(`${BASE}/login`);
    await page.fill('input[type="email"]', EMAIL);
    await page.fill('input[type="password"]', PASSWORD);
    await page.locator('form button[type="submit"]').click();
    await page.waitForURL(/\/(home|onboarding)/, { timeout: 30000 });

    if (page.url().includes('/onboarding')) {
      console.log('Capturing onboarding...');
      await ss(page, '06-onboarding-step1');
      // skip through
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

    // 7. すでに認証済みで /login → /home に飛ばされる挙動
    console.log('\n== Already-home (login while authed) ==');
    await page.goto(`${BASE}/login`);
    await page.waitForURL(/\/home/, { timeout: 10000 });
    await ss(page, '07-already-home');

    console.log('\n== 主要画面 ==');

    await page.goto(`${BASE}/home`);
    await ss(page, '11-home');

    await page.goto(`${BASE}/record`);
    await ss(page, '12-record-hub');
    await ss(page, '40-record-hub-updated'); // alias for batch guide

    // mood
    await page.goto(`${BASE}/record/mood`);
    await ss(page, '13-mood-entry');

    await page.goto(`${BASE}/home`);
    await ss(page, '14-mood-saved-home');

    // thought (CBT) - list view
    await page.goto(`${BASE}/record/thought`);
    await ss(page, '43-thought-list');

    // thought form
    await page.goto(`${BASE}/record/thought/new`);
    await ss(page, '15-thought-record');

    // journal
    await page.goto(`${BASE}/record/journal`);
    await ss(page, '16-journal');

    // sleep
    await page.goto(`${BASE}/record/sleep`);
    await ss(page, '41-sleep-empty');
    try {
      await page.locator('input[type="time"]').first().fill('23:30');
      await page.locator('input[type="time"]').nth(1).fill('07:00');
      await page.locator('button', { hasText: 'よく眠れた' }).first().click();
      await page.waitForTimeout(300);
      await ss(page, '42-sleep-filled');
    } catch (e) {
      console.warn('  ! sleep filled failed:', e.message);
    }

    // cycle
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

    // checkup
    await page.goto(`${BASE}/record/checkup`);
    await ss(page, '44-checkup-home');
    try {
      const start = page.locator('button', { hasText: /はじめてみる|今日また確認する/ }).first();
      if (await start.isVisible().catch(() => false)) {
        await start.click();
        await page.waitForTimeout(700);
        await ss(page, '45-checkup-question');
      }
    } catch (e) {
      console.warn('  ! checkup failed:', e.message);
    }

    // nagomi (kotone alias)
    await page.goto(`${BASE}/kotone`);
    await ss(page, '17-kotone');
    await ss(page, '57-nagomi-chat');

    // nagomi note
    await page.goto(`${BASE}/kotone/note`);
    await ss(page, '35-kotone-note');

    // insights
    await page.goto(`${BASE}/insights`);
    await ss(page, '18-insights');
    await ss(page, '56-insights-with-extras');

    // mindfulness
    await page.goto(`${BASE}/mindfulness`);
    await ss(page, '19-mindfulness');

    // library
    await page.goto(`${BASE}/library`);
    await ss(page, '20-library-index');

    const articles = [
      ['what-is-anxiety', '21-library-anxiety'],
      ['adjustment-disorder', '22-library-adjustment'],
      ['bipolar-long-journey', '23-library-bipolar'],
      ['cognitive-distortions', '24-library-distortions'],
      ['medication-thoughts', '25-library-medication'],
    ];
    for (const [slug, name] of articles) {
      await page.goto(`${BASE}/library/${slug}`);
      await ss(page, name);
    }

    // medication
    await page.goto(`${BASE}/medication`);
    await ss(page, '26-medication');
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
      console.warn('  ! side-effects form failed:', e.message);
    }

    // crisis (auth & with plan link)
    await page.goto(`${BASE}/crisis`);
    await ss(page, '51-crisis-with-plan-link');

    await page.goto(`${BASE}/crisis/plan`);
    await ss(page, '52-safety-plan-empty');

    // mypage
    await page.goto(`${BASE}/mypage`);
    await ss(page, '28-mypage');
    await ss(page, '53-mypage-with-report');

    await page.goto(`${BASE}/mypage/report`);
    await ss(page, '54-doctor-report');

    await page.goto(`${BASE}/mypage/settings`);
    await ss(page, '55-settings-with-name');

    await page.goto(`${BASE}/mypage/data`);
    await ss(page, '39-data-management');

    // home with nagomi label (after all data accumulated)
    await page.goto(`${BASE}/home`);
    await ss(page, '58-home-with-nagomi');

    console.log('\nAll done.');
  } catch (err) {
    console.error('Failed:', err);
    process.exitCode = 1;
  } finally {
    await ctx.close();
    await browser.close();
  }
}

main();
