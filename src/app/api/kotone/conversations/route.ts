import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { conversations, messages as messagesTable } from '@/lib/db/schema';
import { eq, and, desc } from 'drizzle-orm';
import { NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * GET /api/kotone/conversations
 * ユーザーの会話一覧を取得 (最新 50 件)
 */
export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ message: '認証が必要です' }, { status: 401 });
  }

  const data = await db
    .select({
      id: conversations.id,
      title: conversations.title,
      updatedAt: conversations.updatedAt,
      createdAt: conversations.createdAt,
    })
    .from(conversations)
    .where(eq(conversations.userId, session.user.id))
    .orderBy(desc(conversations.updatedAt))
    .limit(50);

  return NextResponse.json({ conversations: data });
}

/**
 * DELETE /api/kotone/conversations
 * 会話を削除 (CASCADE でメッセージも削除)
 */
export async function DELETE(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ message: '認証が必要です' }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  const conversationId = body?.conversation_id;
  if (!conversationId || typeof conversationId !== 'string') {
    return NextResponse.json({ message: '会話IDが必要です' }, { status: 400 });
  }

  // メッセージを先に削除 (Drizzle では CASCADE が自動で効かない場合があるため明示的に)
  await db
    .delete(messagesTable)
    .where(
      and(
        eq(messagesTable.conversationId, conversationId),
        eq(messagesTable.userId, session.user.id),
      ),
    );

  // 会話を削除 (userId チェックで他人の会話は削除不可)
  await db
    .delete(conversations)
    .where(
      and(
        eq(conversations.id, conversationId),
        eq(conversations.userId, session.user.id),
      ),
    );

  return NextResponse.json({ ok: true });
}
