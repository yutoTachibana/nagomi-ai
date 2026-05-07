/**
 * 25-library-medication.png のみ撮り直す.
 */
const { chromium } = require('playwright');

const BASE = process.env.BASE_URL ?? 'https://kn3zrjwqry.ap-northeast-1.awsapprunner.com';
const EMAIL = process.env.SS_EMAIL;
const PASSWORD = process.env.SS_PASSWORD;
const VIEWPORT = { width: 390, height: 844 };

async function main() {
  const browser = await chromium.launch();
  const ctx = await browser.newContext({
    viewport: VIEWPORT,
    deviceScaleFactor: 2,
    ignoreHTTPSErrors: true,
  });
  const page = await ctx.newPage();
  await page.goto(`${BASE}/login`);
  await page.fill('input[type="email"]', EMAIL);
  await page.fill('input[type="password"]', PASSWORD);
  await page.locator('form button[type="submit"]').click();
  await page.waitForURL(/\/(home|onboarding)/, { timeout: 30000 });
  await page.goto(`${BASE}/library/about-medication`);
  await page.waitForLoadState('networkidle').catch(() => {});
  await page.waitForTimeout(800);
  await page.screenshot({ path: 'screenshots/25-library-medication.png', fullPage: true });
  console.log('Done');
  await browser.close();
}
main();
