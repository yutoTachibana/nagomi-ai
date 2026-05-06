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

  // Add user context section (wrapped in XML tag, treated as data not instructions)
  // Memory poisoning 対策: 過去情報は明示的に区切られ、現在の会話と無関係なら触れない
  if (contextItems.length > 0) {
    const grouped = new Map<string, string[]>();
    for (const item of contextItems) {
      const list = grouped.get(item.category) ?? [];
      list.push(item.content);
      grouped.set(item.category, list);
    }

    prompt += '\n\n<user_context>\n';
    prompt += '## この利用者について (過去の会話からの参考情報)\n\n';
    prompt += '以下は **参考情報** です. 現在の会話の流れと直接関係しない場合は触れないでください.\n';
    prompt += '無関係なテーマでこの情報を持ち出すと、利用者にとって「聞いていない」サインになります.\n\n';

    for (const [cat, items] of grouped) {
      const label = CATEGORY_LABELS[cat] ?? cat;
      prompt += `### ${label}\n`;
      for (const item of items) {
        prompt += `- ${item}\n`;
      }
      prompt += '\n';
    }
    prompt += '</user_context>\n';
  }

  // Add recent summaries (also wrapped)
  const summariesWithContent = recentSummaries.filter(s => s.summary);
  if (summariesWithContent.length > 0) {
    prompt += '\n<recent_conversation_summaries>\n';
    prompt += '## 最近の会話の要約\n\n';
    for (const s of summariesWithContent) {
      prompt += `- ${s.summary}\n`;
    }
    prompt += '\nこの情報は **参考** です. 自然な文脈で関連したときだけ活かし、わざわざ「前回は〜」と切り出さないでください.\n';
    prompt += '</recent_conversation_summaries>\n';
  }

  // Add crisis addendum if any
  if (crisisAddendum) {
    prompt += `\n\n${crisisAddendum}`;
  }

  return prompt;
}
