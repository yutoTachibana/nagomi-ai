/**
 * 本番 DB マイグレーション
 *
 * 使い方:
 *   DATABASE_URL=postgresql://... npx tsx scripts/migrate-production.ts
 *
 * drizzle-kit push を本番 DB に対して実行する
 */

import { execSync } from 'child_process';

const dbUrl = process.env.DATABASE_URL;
if (!dbUrl) {
  console.error('DATABASE_URL が設定されていません');
  process.exit(1);
}

console.log('=== 本番 DB マイグレーション開始 ===');
console.log(`接続先: ${dbUrl.replace(/\/\/[^@]+@/, '//***@')}`); // パスワードを隠す

try {
  execSync('npx drizzle-kit push', {
    stdio: 'inherit',
    env: { ...process.env, DATABASE_URL: dbUrl },
  });
  console.log('=== マイグレーション完了 ===');
} catch (err) {
  console.error('マイグレーション失敗:', err);
  process.exit(1);
}
