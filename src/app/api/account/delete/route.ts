import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { users } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ message: '認証が必要です' }, { status: 401 });
  }
  const userId = session.user.id;

  const json = await req.json().catch(() => null);
  if (!json || json.confirmation !== '削除します') {
    return NextResponse.json(
      { message: '確認テキストが一致しません' },
      { status: 400 },
    );
  }

  try {
    await db.delete(users).where(eq(users.id, userId));
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json(
      { message: '削除に失敗しました。もう一度お試しください。' },
      { status: 500 },
    );
  }
}
