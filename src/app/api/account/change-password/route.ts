import { NextResponse } from 'next/server';
import { z } from 'zod';
import bcrypt from 'bcryptjs';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { users } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

const Body = z.object({
  current_password: z.string().min(1),
  new_password: z.string().min(8),
});

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ message: '認証が必要です' }, { status: 401 });
  const userId = session.user.id;

  const json = await req.json().catch(() => null);
  const parsed = Body.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ message: '入力をもう一度確認してみてください' }, { status: 400 });
  }

  try {
    const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
    if (!user) {
      return NextResponse.json({ message: 'ユーザーが見つかりません' }, { status: 404 });
    }

    if (!user.passwordHash) {
      return NextResponse.json(
        { message: 'ソーシャルログインのアカウントではパスワードを設定できません' },
        { status: 400 },
      );
    }

    const valid = await bcrypt.compare(parsed.data.current_password, user.passwordHash);
    if (!valid) {
      return NextResponse.json({ message: '現在のパスワードが正しくありません' }, { status: 400 });
    }

    const newHash = await bcrypt.hash(parsed.data.new_password, 12);
    await db.update(users).set({
      passwordHash: newHash,
      updatedAt: new Date().toISOString(),
    }).where(eq(users.id, userId));

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ message: '変更に失敗しました。もう一度試してみてください。' }, { status: 500 });
  }
}
