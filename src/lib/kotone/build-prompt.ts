import { db } from '@/lib/db';
import { userContext, conversations } from '@/lib/db/schema';
import { eq, desc } from 'drizzle-orm';
import { KOTONE_SYSTEM_PROMPT } from '@/lib/claude/system-prompts';

const CATEGORY_LABELS: Record<string, string> = {
  background: '生活の背景',
  coping: '助けになること',
  trigger: 'しんどくなりやすい場面',
  preference: '話し方の好み',
  custom: '本人からのメモ',
};

/**
 * ユーザーコンテキストと最近の会話要約を含むシステムプロンプトを構築する.
 *
 * ことねが「この人のことを覚えている」ように振る舞うための基盤.
 * コンテキストは押しつけずに自然に活かすよう指示する.
 */
export async function buildSystemPrompt(userId: string, crisisAddendum?: string | null): Promise<string> {
  // Load user context
  const contextItems = await db.select({
    category: userContext.category,
    content: userContext.content,
  })
    .from(userContext)
    .where(eq(userContext.userId, userId))
    .limit(50);

  // Load recent conversation summaries (last 5)
  const recentSummaries = await db.select({
    summary: conversations.summary,
    updatedAt: conversations.updatedAt,
  })
    .from(conversations)
    .where(eq(conversations.userId, userId))
    .orderBy(desc(conversations.updatedAt))
    .limit(5);

  let prompt = KOTONE_SYSTEM_PROMPT;

  // Add user context section
  if (contextItems.length > 0) {
    const grouped = new Map<string, string[]>();
    for (const item of contextItems) {
      const list = grouped.get(item.category) ?? [];
      list.push(item.content);
      grouped.set(item.category, list);
    }

    prompt += '\n\n## この利用者について (ことねノートから)\n\n';
    prompt += 'これまでの会話から、以下のことが分かっています。押しつけずに、自然に活かしてください。\n\n';

    for (const [cat, items] of grouped) {
      const label = CATEGORY_LABELS[cat] ?? cat;
      prompt += `### ${label}\n`;
      for (const item of items) {
        prompt += `- ${item}\n`;
      }
      prompt += '\n';
    }
  }

  // Add recent summaries
  const summariesWithContent = recentSummaries.filter(s => s.summary);
  if (summariesWithContent.length > 0) {
    prompt += '\n\n## 最近の会話の要約\n\n';
    for (const s of summariesWithContent) {
      prompt += `- ${s.summary}\n`;
    }
    prompt += '\nこの情報は自然な文脈で活かしてください。わざわざ「前回は〜」と切り出す必要はありませんが、関連する話題が出たら繋げてください。\n';
  }

  // Add crisis addendum if any
  if (crisisAddendum) {
    prompt += `\n\n${crisisAddendum}`;
  }

  return prompt;
}
