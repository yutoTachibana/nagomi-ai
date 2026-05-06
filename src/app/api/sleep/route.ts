import { NextResponse } from 'next/server';
import { z } from 'zod';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { sleepEntries } from '@/lib/db/schema';
import { eq, desc } from 'drizzle-orm';

const Body = z.object({
  recorded_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  bedtime: z.string().nullable().optional(),
  wake_time: z.string().nullable().optional(),
  quality_score: z.number().int().min(1).max(5).nullable().optional(),
  note_encrypted: z.string().nullable().optional(),
});

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ message: '認証が必要です' }, { status: 401 });
  const userId = session.user.id;

  const json = await req.json().catch(() => null);
  const parsed = Body.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ message: '入力に誤りがあります' }, { status: 400 });
  }

  try {
    const [entry] = await db.insert(sleepEntries).values({
      userId,
      recordedDate: parsed.data.recorded_date,
      bedtime: parsed.data.bedtime ?? null,
      wakeTime: parsed.data.wake_time ?? null,
      qualityScore: parsed.data.quality_score ?? null,
      noteEncrypted: parsed.data.note_encrypted ?? null,
    }).returning();

    return NextResponse.json({ ok: true, entry });
  } catch (err) {
    console.error('[sleep] insert failed:', err);
    return NextResponse.json({ message: '保存に失敗しました' }, { status: 500 });
  }
}

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ message: '認証が必要です' }, { status: 401 });
  const userId = session.user.id;

  try {
    const entries = await db.select()
      .from(sleepEntries)
      .where(eq(sleepEntries.userId, userId))
      .orderBy(desc(sleepEntries.recordedDate))
      .limit(100);

    return NextResponse.json({ entries });
  } catch (err) {
    console.error('[sleep] select failed:', err);
    return NextResponse.json({ message: '読み込みに失敗しました' }, { status: 500 });
  }
}
