import { NextResponse } from 'next/server';
import { z } from 'zod';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { communityPosts, communityHearts } from '@/lib/db/schema';
import { eq, and, desc, inArray } from 'drizzle-orm';

const CreatePostBody = z.object({
  content: z.string().min(1, '内容を入力してください').max(500, '500文字以内で書いてください'),
  display_name: z.string().min(1, '表示名を入力してください').max(30),
});

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ message: '認証が必要です' }, { status: 401 });
  const userId = session.user.id;

  const json = await req.json().catch(() => null);
  const parsed = CreatePostBody.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { message: '入力をご確認ください', issues: parsed.error.issues },
      { status: 400 },
    );
  }

  try {
    const [post] = await db.insert(communityPosts).values({
      authorId: userId,
      displayName: parsed.data.display_name,
      content: parsed.data.content,
      status: 'pending',
    }).returning();

    return NextResponse.json({ ok: true, post });
  } catch {
    return NextResponse.json({ message: '投稿に失敗しました' }, { status: 500 });
  }
}

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ message: '認証が必要です' }, { status: 401 });
  const userId = session.user.id;

  try {
    // Fetch approved posts
    const posts = await db.select({
      id: communityPosts.id,
      displayName: communityPosts.displayName,
      content: communityPosts.content,
      heartsCount: communityPosts.heartsCount,
      status: communityPosts.status,
      createdAt: communityPosts.createdAt,
      approvedAt: communityPosts.approvedAt,
    })
      .from(communityPosts)
      .where(eq(communityPosts.status, 'approved'))
      .orderBy(desc(communityPosts.createdAt))
      .limit(50);

    // Fetch user's own pending posts
    const myPending = await db.select({
      id: communityPosts.id,
      displayName: communityPosts.displayName,
      content: communityPosts.content,
      heartsCount: communityPosts.heartsCount,
      status: communityPosts.status,
      createdAt: communityPosts.createdAt,
    })
      .from(communityPosts)
      .where(and(eq(communityPosts.authorId, userId), eq(communityPosts.status, 'pending')))
      .orderBy(desc(communityPosts.createdAt));

    // Fetch which posts the user has hearted
    const postIds = posts.map((p) => p.id);
    let heartedIds: string[] = [];
    if (postIds.length > 0) {
      const hearts = await db.select({ postId: communityHearts.postId })
        .from(communityHearts)
        .where(and(eq(communityHearts.userId, userId), inArray(communityHearts.postId, postIds)));
      heartedIds = hearts.map((h) => h.postId);
    }

    return NextResponse.json({
      posts,
      pending: myPending,
      heartedIds,
    });
  } catch {
    return NextResponse.json({ message: '読み込みに失敗しました' }, { status: 500 });
  }
}
