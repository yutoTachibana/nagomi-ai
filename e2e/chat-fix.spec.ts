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
}

async function openThreadList(page: import('@playwright/test').Page) {
  await page.goto(`${BASE}/kotone`);
  await page.waitForTimeout(1500);
  const listBtn = page.locator('[aria-label="会話一覧"]').first();
  if (await listBtn.isVisible()) {
    await listBtn.click();
    await page.waitForTimeout(600);
  }
}

test('32-仕事のストレスの会話', async ({ page }) => {
  await login(page);
  await openThreadList(page);

  await page.locator('button:has-text("仕事のストレスについて")').click();
  // Wait for chat header to reappear (list is hidden, chat is shown)
  await page.waitForSelector('text=ことね', { timeout: 5000 });
  await page.waitForTimeout(2000); // Wait for messages to load
  await ss(page, '32-kotone-work-stress-thread');
});

test('33-眠れない夜の会話', async ({ page }) => {
  await login(page);
  await openThreadList(page);

  await page.locator('button:has-text("眠れない夜のこと")').click();
  await page.waitForSelector('text=ことね', { timeout: 5000 });
  await page.waitForTimeout(2000);
  await ss(page, '33-kotone-sleepless-thread');
});
