import { NextResponse } from 'next/server';
import { z } from 'zod';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { journalEntries } from '@/lib/db/schema';
import { eq, desc } from 'drizzle-orm';

const Body = z.object({
  content_encrypted: z.string().min(1),
  prompt_key: z.string().nullable(),
});

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ message: '認証が必要です' }, { status: 401 });
  const userId = session.user.id;

  const json = await req.json().catch(() => null);
  const parsed = Body.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ message: '入力に誤りがあります', issues: parsed.error.issues }, { status: 400 });
  }

  try {
    const [entry] = await db.insert(journalEntries).values({
      userId,
      contentEncrypted: parsed.data.content_encrypted,
      promptKey: parsed.data.prompt_key,
    }).returning();

    return NextResponse.json({ ok: true, entry });
  } catch (err) {
    console.error('[journal] insert failed:', { userId, err: err instanceof Error ? err.message : err });
    return NextResponse.json({ message: '保存に失敗しました' }, { status: 500 });
  }
}

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ message: '認証が必要です' }, { status: 401 });
  const userId = session.user.id;

  try {
    const entries = await db.select({
      id: journalEntries.id,
      promptKey: journalEntries.promptKey,
      contentEncrypted: journalEntries.contentEncrypted,
      createdAt: journalEntries.createdAt,
    })
      .from(journalEntries)
      .where(eq(journalEntries.userId, userId))
      .orderBy(desc(journalEntries.createdAt))
      .limit(30);

    return NextResponse.json({ entries });
  } catch {
    return NextResponse.json({ message: '読み込みに失敗しました' }, { status: 500 });
  }
}
