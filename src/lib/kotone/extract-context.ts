import { db } from '@/lib/db';
import { messages as messagesTable, conversations, userContext } from '@/lib/db/schema';
import { eq, and, desc } from 'drizzle-orm';
import { getAnthropic, getModel } from '@/lib/claude/client';
import { CONTEXT_EXTRACTION_PROMPT } from '@/lib/claude/system-prompts';

/**
 * 会話後にユーザーコンテキストを非同期で抽出する.
 *
 * - 最新 10 件のメッセージを取得
 * - 既存コンテキストと重複しないように Claude に抽出させる
 * - 結果を userContext テーブルに保存し、会話の summary を更新
 *
 * この処理はチャットの応答をブロックしないよう fire-and-forget で呼ばれる.
 * エラーが起きてもチャットフローを壊さないこと.
 */
export async function extractContext(userId: string, conversationId: string) {
  try {
    // Get the last 10 messages from this conversation
    const msgs = await db.select({
      role: messagesTable.role,
      content: messagesTable.contentEncrypted,
    })
      .from(messagesTable)
      .where(and(
        eq(messagesTable.conversationId, conversationId),
        eq(messagesTable.userId, userId),
      ))
      .orderBy(desc(messagesTable.createdAt))
      .limit(10);

    if (msgs.length < 2) return; // Need at least one exchange

    // Get existing context to pass as "already known"
    const existing = await db.select({ content: userContext.content })
      .from(userContext)
      .where(eq(userContext.userId, userId));

    const existingStr = existing.map(e => e.content).join('\n');

    // Build the extraction request
    const conversationText = msgs
      .reverse()
      .map(m => `${m.role === 'user' ? '利用者' : 'ことね'}: ${m.content}`)
      .join('\n\n');

    const prompt = `${CONTEXT_EXTRACTION_PROMPT}

既に把握済みの情報 (重複して抽出しないこと):
${existingStr || '(なし)'}

会話:
${conversationText}`;

    const anthropic = getAnthropic();
    const response = await anthropic.messages.create({
      model: getModel(),
      max_tokens: 512,
      messages: [{ role: 'user', content: prompt }],
    });

    // Parse response
    const text = response.content[0].type === 'text' ? response.content[0].text : '';
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return;

    const parsed = JSON.parse(jsonMatch[0]) as {
      summary: string;
      context: { category: string; content: string }[];
    };

    // Save summary
    if (parsed.summary) {
      await db.update(conversations)
        .set({ summary: parsed.summary })
        .where(eq(conversations.id, conversationId));
    }

    // Save new context items
    if (parsed.context?.length > 0) {
      const validCategories = ['background', 'coping', 'trigger', 'preference'];
      const items = parsed.context
        .filter(c => validCategories.includes(c.category) && c.content)
        .map(c => ({
          userId,
          category: c.category,
          content: c.content,
          source: 'ai' as const,
          conversationId,
        }));

      if (items.length > 0) {
        await db.insert(userContext).values(items);
      }
    }
  } catch (err) {
    // Context extraction is non-critical - don't break the chat flow
    console.error('Context extraction failed:', err);
  }
}
