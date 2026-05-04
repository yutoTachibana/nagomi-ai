/**
 * 定期バッチ処理: クリーンアップジョブ
 *
 * 実行: npx tsx scripts/cleanup.ts
 * cron: 0 3 * * * (毎日 AM 3:00)
 *
 * 処理内容:
 *  1. 期限切れトークンの削除 (password_reset, email_verification)
 *  2. 空の会話の削除 (メッセージ 0 件)
 *  3. ユーザーコンテキストの重複整理
 */

import { config } from 'dotenv';
config({ path: '.env.local' });

import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { eq, lt, sql, and, inArray } from 'drizzle-orm';
import {
  passwordResetTokens,
  emailVerificationTokens,
  conversations,
  messages,
  userContext,
} from '../src/lib/db/schema';

const client = postgres(process.env.DATABASE_URL!);
const db = drizzle(client);

async function cleanExpiredTokens() {
  const now = new Date();

  const deletedReset = await db
    .delete(passwordResetTokens)
    .where(lt(passwordResetTokens.expiresAt, now))
    .returning({ id: passwordResetTokens.id });

  const deletedVerify = await db
    .delete(emailVerificationTokens)
    .where(lt(emailVerificationTokens.expiresAt, now))
    .returning({ id: emailVerificationTokens.id });

  console.log(`[tokens] 期限切れ削除: reset=${deletedReset.length}, verify=${deletedVerify.length}`);
}

async function cleanEmptyConversations() {
  // メッセージが 0 件かつ作成から 1 時間以上経過した会話を削除
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);

  const emptyConvs = await db
    .select({ id: conversations.id })
    .from(conversations)
    .leftJoin(messages, eq(conversations.id, messages.conversationId))
    .where(
      and(
        lt(conversations.createdAt, oneHourAgo),
        sql`${messages.id} IS NULL`,
      ),
    )
    .groupBy(conversations.id);

  if (emptyConvs.length > 0) {
    const ids = emptyConvs.map((c) => c.id);
    await db.delete(conversations).where(inArray(conversations.id, ids));
  }

  console.log(`[conversations] 空の会話削除: ${emptyConvs.length} 件`);
}

async function deduplicateUserContext() {
  // 同一ユーザー・同一カテゴリで内容が完全一致するものを重複排除
  // 最新のものを残し、古いものを削除
  const duplicates = await db.execute(sql`
    DELETE FROM user_context
    WHERE id IN (
      SELECT id FROM (
        SELECT id,
          ROW_NUMBER() OVER (
            PARTITION BY user_id, category, content
            ORDER BY created_at DESC
          ) AS rn
        FROM user_context
      ) sub
      WHERE rn > 1
    )
  `);

  console.log(`[context] 重複コンテキスト削除完了`);
}

async function main() {
  console.log(`=== こもれび クリーンアップ開始: ${new Date().toISOString()} ===`);

  try {
    await cleanExpiredTokens();
    await cleanEmptyConversations();
    await deduplicateUserContext();
    console.log(`=== クリーンアップ完了 ===`);
  } catch (err) {
    console.error('クリーンアップエラー:', err);
    process.exit(1);
  } finally {
    await client.end();
  }
}

main();
