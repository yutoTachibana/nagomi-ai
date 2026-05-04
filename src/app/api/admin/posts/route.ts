import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { users, communityPosts } from '@/lib/db/schema';
import { eq, desc } from 'drizzle-orm';

async function requireAdmin() {
  const session = await auth();
  if (!session?.user?.id) {
    return { error: NextResponse.json({ message: '認証が必要です' }, { status: 401 }) };
  }

  const [user] = await db
    .select({ role: users.role })
    .from(users)
    .where(eq(users.id, session.user.id))
    .limit(1);

  if (user?.role !== 'admin') {
    return { error: NextResponse.json({ message: '権限がありません' }, { status: 403 }) };
  }

  return { userId: session.user.id };
}

export async function GET(req: NextRequest) {
  const result = await requireAdmin();
  if ('error' in result) return result.error;

  const status = req.nextUrl.searchParams.get('status') ?? 'pending';

  try {
    const query = db
      .select({
        id: communityPosts.id,
        authorId: communityPosts.authorId,
        displayName: communityPosts.displayName,
        content: communityPosts.content,
        heartsCount: communityPosts.heartsCount,
        status: communityPosts.status,
        createdAt: communityPosts.createdAt,
        approvedAt: communityPosts.approvedAt,
      })
      .from(communityPosts)
      .orderBy(desc(communityPosts.createdAt))
      .limit(100);

    const posts =
      status === 'all'
        ? await query
        : await query.where(eq(communityPosts.status, status));

    return NextResponse.json({ posts });
  } catch {
    return NextResponse.json({ message: '読み込みに失敗しました' }, { status: 500 });
  }
}

const PatchBody = z.object({
  postId: z.string().uuid(),
  status: z.enum(['approved', 'hidden']),
});

export async function PATCH(req: Request) {
  const result = await requireAdmin();
  if ('error' in result) return result.error;

  const json = await req.json().catch(() => null);
  const parsed = PatchBody.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { message: '入力に誤りがあります', issues: parsed.error.issues },
      { status: 400 },
    );
  }

  try {
    const [updated] = await db
      .update(communityPosts)
      .set({
        status: parsed.data.status,
        approvedAt: parsed.data.status === 'approved' ? new Date() : null,
      })
      .where(eq(communityPosts.id, parsed.data.postId))
      .returning();

    if (!updated) {
      return NextResponse.json({ message: '投稿が見つかりません' }, { status: 404 });
    }

    return NextResponse.json({ ok: true, post: updated });
  } catch {
    return NextResponse.json({ message: '更新に失敗しました' }, { status: 500 });
  }
}
