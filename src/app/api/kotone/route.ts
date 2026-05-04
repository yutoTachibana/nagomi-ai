import { z } from 'zod';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { safetyEvents, conversations, messages as messagesTable } from '@/lib/db/schema';
import { eq, and, asc } from 'drizzle-orm';
import { getAnthropic, getModel } from '@/lib/claude/client';
import { KOTONE_SYSTEM_PROMPT } from '@/lib/claude/system-prompts';
import { checkCrisis, getCrisisPrompt } from '@/lib/safety/crisis-detector';
import { checkRateLimit, getClientIp } from '@/lib/rate-limit';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const Body = z.object({
  conversation_id: z.string().uuid().optional(),
  message: z.string().min(1).max(4000),
});

/**
 * SSE レスポンスを書き込むヘルパ
 */
function sseChunk(controller: ReadableStreamDefaultController, payload: unknown) {
  const enc = new TextEncoder();
  controller.enqueue(enc.encode(`data: ${JSON.stringify(payload)}\n\n`));
}

export async function POST(req: Request) {
  // ----- レート制限 (30 回/時) -----
  const ip = getClientIp(req);
  const rl = checkRateLimit(`kotone:${ip}`, 30, 60 * 60 * 1000);
  if (!rl.allowed) {
    return new Response(JSON.stringify({ message: '少し休憩してから、また話しかけてください。' }), { status: 429 });
  }

  const session = await auth();
  if (!session?.user?.id) {
    return new Response(JSON.stringify({ message: '認証が必要です' }), { status: 401 });
  }
  const userId = session.user.id;

  const json = await req.json().catch(() => null);
  const parsed = Body.safeParse(json);
  if (!parsed.success) {
    return new Response(JSON.stringify({ message: '入力に誤りがあります' }), { status: 400 });
  }

  const { conversation_id, message } = parsed.data;

  // ----- クライシス検知 -----
  const crisis = checkCrisis(message);
  if (crisis.flagged) {
    await db.insert(safetyEvents).values({
      userId,
      eventType: 'crisis_keyword_detected',
      contextPath: '/kotone',
    });
  }

  // ----- 会話の取得 or 作成 -----
  let convId = conversation_id;
  if (!convId) {
    try {
      const [newConv] = await db.insert(conversations).values({
        userId,
        title: '',
      }).returning({ id: conversations.id });
      convId = newConv.id;
    } catch {
      return new Response(JSON.stringify({ message: '会話を開始できませんでした' }), { status: 500 });
    }
  }

  // ----- 過去のメッセージを取得 (簡易: 最新 20 件) -----
  const history = await db.select({
    role: messagesTable.role,
    contentEncrypted: messagesTable.contentEncrypted,
  })
    .from(messagesTable)
    .where(and(eq(messagesTable.conversationId, convId), eq(messagesTable.userId, userId)))
    .orderBy(asc(messagesTable.createdAt))
    .limit(20);

  // ----- ユーザーメッセージを保存 -----
  await db.insert(messagesTable).values({
    conversationId: convId,
    userId,
    role: 'user',
    contentEncrypted: message,
    crisisFlagged: crisis.flagged,
  });

  // ----- 新規会話の場合、最初のメッセージからタイトルを生成 -----
  if (!conversation_id) {
    const title = message.length > 30 ? message.slice(0, 30) + '...' : message;
    await db.update(conversations).set({ title }).where(eq(conversations.id, convId!));
  }

  if (crisis.flagged) {
    await db.update(conversations)
      .set({ everCrisisFlagged: true })
      .where(eq(conversations.id, convId));
  }

  // ----- Claude API 呼び出し -----
  const anthropic = getAnthropic();
  const model = getModel();

  const systemPrompt =
    KOTONE_SYSTEM_PROMPT +
    (getCrisisPrompt(crisis) ? `\n\n${getCrisisPrompt(crisis)}` : '');

  const chatMessages = [
    ...history.map((m) => ({
      role: m.role as 'user' | 'assistant',
      content: m.contentEncrypted,
    })),
    { role: 'user' as const, content: message },
  ];

  const stream = new ReadableStream({
    async start(controller) {
      try {
        // メタ情報を最初に送る (新規会話の場合に conversation_id を返す)
        sseChunk(controller, { type: 'meta', conversation_id: convId });

        if (crisis.flagged) {
          sseChunk(controller, { type: 'crisis', level: crisis.level });
        }

        const response = await anthropic.messages.stream({
          model,
          max_tokens: 1024,
          system: systemPrompt,
          messages: chatMessages,
        });

        let fullText = '';
        let inputTokens = 0;
        let outputTokens = 0;

        for await (const event of response) {
          if (event.type === 'content_block_delta' && event.delta.type === 'text_delta') {
            const text = event.delta.text;
            fullText += text;
            sseChunk(controller, { type: 'chunk', text });
          } else if (event.type === 'message_delta' && event.usage) {
            outputTokens = event.usage.output_tokens;
          } else if (event.type === 'message_start' && event.message.usage) {
            inputTokens = event.message.usage.input_tokens;
          }
        }

        // 完了後: アシスタント応答を保存
        await db.insert(messagesTable).values({
          conversationId: convId!,
          userId,
          role: 'assistant',
          contentEncrypted: fullText,
          crisisFlagged: false,
          tokensInput: inputTokens,
          tokensOutput: outputTokens,
        });

        // 会話の updated_at を更新
        await db.update(conversations)
          .set({ updatedAt: new Date() })
          .where(eq(conversations.id, convId!));

        sseChunk(controller, { type: 'done' });
      } catch (err) {
        console.error('Claude streaming error', err);
        sseChunk(controller, {
          type: 'error',
          message: 'AI 応答の生成に失敗しました',
        });
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream; charset=utf-8',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
    },
  });
}
