import { db } from '@/lib/db';
import { userContext, conversations, profiles, cycleEntries } from '@/lib/db/schema';
import { eq, desc } from 'drizzle-orm';
import { KOTONE_SYSTEM_PROMPT } from '@/lib/claude/system-prompts';
import { estimatePhase, phaseLabel, type CycleEntry } from '@/lib/cycle';

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
 * なごみが「この人のことを覚えている」ように振る舞うための基盤.
 * コンテキストは押しつけずに自然に活かすよう指示する.
 */
export async function buildSystemPrompt(userId: string, crisisAddendum?: string | null): Promise<string> {
  // Load user context (limit to 10 most recent items to prevent over-anchoring)
  const contextItems = await db.select({
    category: userContext.category,
    content: userContext.content,
  })
    .from(userContext)
    .where(eq(userContext.userId, userId))
    .orderBy(desc(userContext.createdAt))
    .limit(10);

  // Load recent conversation summaries (last 3)
  const recentSummaries = await db.select({
    summary: conversations.summary,
    updatedAt: conversations.updatedAt,
  })
    .from(conversations)
    .where(eq(conversations.userId, userId))
    .orderBy(desc(conversations.updatedAt))
    .limit(3);

  // サイクル機能が有効でデータがあれば、現在の位相をヒントとして渡す.
  // 「利用者が話題にしたときだけ触れる」スタンスをプロンプトで明示.
  let cyclePhaseHint: string | null = null;
  try {
    const [profile] = await db.select({ trackCycle: profiles.trackCycle })
      .from(profiles)
      .where(eq(profiles.id, userId))
      .limit(1);
    if (profile?.trackCycle) {
      const rawCycles = await db.select({
        id: cycleEntries.id,
        startDate: cycleEntries.startDate,
        endDate: cycleEntries.endDate,
      })
        .from(cycleEntries)
        .where(eq(cycleEntries.userId, userId))
        .orderBy(desc(cycleEntries.startDate))
        .limit(6);
      if (rawCycles.length > 0) {
        const list: CycleEntry[] = rawCycles;
        const phaseInfo = estimatePhase(list);
        if (phaseInfo && phaseInfo.phase !== 'unknown') {
          cyclePhaseHint = `${phaseLabel(phaseInfo.phase)} (周期 ${phaseInfo.dayInCycle} 日目, 推定 ${phaseInfo.cycleLength} 日周期)`;
        }
      }
    }
  } catch {
    // 失敗してもチャットを止めない
  }

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

  // サイクル位相のヒント (opt-in 有効時のみ)
  if (cyclePhaseHint) {
    prompt += `\n\n<cycle_phase_hint>
利用者は月経サイクルを記録しており、今日の推定位相は: **${cyclePhaseHint}** です.

この情報は **利用者から月経・気分の波・体調の話題が出たときだけ** 参照してください.
こちらから「今は黄体期ですね」と切り出してはいけません. プライベートな情報です.

利用者が「最近イライラがひどい」「生理前かも」「気分の波が…」のような関連トピックに触れたとき、
位相を踏まえて「もしかしたら生理前の影響もあるかもしれませんね」と **選択肢として** 添える程度に.
押し付けは絶対にしない. 「ホルモンのせい」と利用者の感情を矮小化しない.
</cycle_phase_hint>\n`;
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

  // Final reminder — placed at the end so it benefits from recency bias.
  // 過去情報からの逸脱は最も多い失敗モードのため、最後に強く再注意する.
  if (contextItems.length > 0 || summariesWithContent.length > 0) {
    prompt += `\n<final_reminder>
**最重要**: 上記の <user_context> や <recent_conversation_summaries> に書かれた話題 (特定の人物名、過去に話したテーマなど) は、利用者が **今このターンの発言で言及していない限り、こちらから持ち出してはいけません**.

例えば、利用者が「週2、22時に配信してる」と答えたとき:
- 正しい: 配信の頻度・時間帯について受け止めて続ける
- 間違い: 「22時」「夜」から過去に登場した人物 (例: よるちゃん) を連想して話題にする ← 利用者は配信の話をしているのに、勝手に別の話題に飛んでいる

「直前のターンで自分が何を聞いたか」「利用者の発言にどんな単語が含まれているか」だけを基に応答を組み立てます. user_context の情報は、利用者がそのトピックを **明示的に呼び出したとき** だけ参照します.
</final_reminder>\n`;
  }

  // Add crisis addendum if any (placed last so crisis instructions win)
  if (crisisAddendum) {
    prompt += `\n\n${crisisAddendum}`;
  }

  return prompt;
}
