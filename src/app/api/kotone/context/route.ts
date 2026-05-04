import { NextResponse } from 'next/server';
import { z } from 'zod';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { userContext } from '@/lib/db/schema';
import { eq, and, desc } from 'drizzle-orm';

const VALID_CATEGORIES = ['background', 'coping', 'trigger', 'preference', 'custom'] as const;

const PostBody = z.object({
  category: z.enum(VALID_CATEGORIES),
  content: z.string().min(1).max(500),
});

const DeleteBody = z.object({
  id: z.string().uuid(),
});

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ message: '認証が必要です' }, { status: 401 });
  }

  try {
    const items = await db
      .select()
      .from(userContext)
      .where(eq(userContext.userId, session.user.id))
      .orderBy(desc(userContext.createdAt));

    return NextResponse.json({ items });
  } catch {
    return NextResponse.json({ message: '読み込みに失敗しました' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ message: '認証が必要です' }, { status: 401 });
  }

  const json = await req.json().catch(() => null);
  const parsed = PostBody.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ message: '入力に誤りがあります' }, { status: 400 });
  }

  try {
    const [item] = await db
      .insert(userContext)
      .values({
        userId: session.user.id,
        category: parsed.data.category,
        content: parsed.data.content,
        source: 'user',
      })
      .returning();

    return NextResponse.json({ ok: true, item });
  } catch {
    return NextResponse.json({ message: '保存に失敗しました' }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ message: '認証が必要です' }, { status: 401 });
  }

  const json = await req.json().catch(() => null);
  const parsed = DeleteBody.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ message: '入力に誤りがあります' }, { status: 400 });
  }

  try {
    await db
      .delete(userContext)
      .where(
        and(
          eq(userContext.id, parsed.data.id),
          eq(userContext.userId, session.user.id),
        ),
      );

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ message: '削除に失敗しました' }, { status: 500 });
  }
}
