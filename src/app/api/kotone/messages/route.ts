import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { messages as messagesTable } from '@/lib/db/schema';
import { eq, and, asc } from 'drizzle-orm';
import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * GET /api/kotone/messages?conversation_id=xxx
 * 会話のメッセージ一覧を取得
 */
export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ message: '認証が必要です' }, { status: 401 });
  }

  const conversationId = req.nextUrl.searchParams.get('conversation_id');
  if (!conversationId) {
    return NextResponse.json({ message: '会話IDが必要です' }, { status: 400 });
  }

  const rows = await db
    .select({
      id: messagesTable.id,
      role: messagesTable.role,
      contentEncrypted: messagesTable.contentEncrypted,
      createdAt: messagesTable.createdAt,
    })
    .from(messagesTable)
    .where(
      and(
        eq(messagesTable.conversationId, conversationId),
        eq(messagesTable.userId, session.user.id),
      ),
    )
    .orderBy(asc(messagesTable.createdAt));

  // contentEncrypted → content にマッピング (Chat コンポーネントの形式に合わせる)
  const messages = rows.map((row) => ({
    id: row.id,
    role: row.role,
    content: row.contentEncrypted,
    createdAt: row.createdAt,
  }));

  return NextResponse.json({ messages });
}
