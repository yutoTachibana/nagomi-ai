import { NextResponse } from 'next/server';
import { z } from 'zod';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { communityHearts, communityPosts } from '@/lib/db/schema';
import { eq, and, sql } from 'drizzle-orm';

const Body = z.object({
  post_id: z.string().uuid(),
});

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ message: '認証が必要です' }, { status: 401 });
  const userId = session.user.id;

  const json = await req.json().catch(() => null);
  const parsed = Body.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ message: '入力をご確認ください' }, { status: 400 });
  }

  const { post_id } = parsed.data;

  try {
    // Check if already hearted
    const [existing] = await db.select({ postId: communityHearts.postId })
      .from(communityHearts)
      .where(and(eq(communityHearts.userId, userId), eq(communityHearts.postId, post_id)))
      .limit(1);

    if (existing) {
      // Remove heart
      await db.delete(communityHearts)
        .where(and(eq(communityHearts.userId, userId), eq(communityHearts.postId, post_id)));

      await db.update(communityPosts)
        .set({ heartsCount: sql`greatest(0, ${communityPosts.heartsCount} - 1)` })
        .where(eq(communityPosts.id, post_id));

      return NextResponse.json({ hearted: false });
    } else {
      // Add heart
      await db.insert(communityHearts).values({ userId, postId: post_id });

      await db.update(communityPosts)
        .set({ heartsCount: sql`${communityPosts.heartsCount} + 1` })
        .where(eq(communityPosts.id, post_id));

      return NextResponse.json({ hearted: true });
    }
  } catch {
    return NextResponse.json({ message: '処理に失敗しました' }, { status: 500 });
  }
}
