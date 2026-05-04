import { NextResponse } from 'next/server';
import { z } from 'zod';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { moodEntries } from '@/lib/db/schema';
import { eq, desc } from 'drizzle-orm';

const Body = z.object({
  mood_score: z.number().int().min(1).max(5),
  energy_level: z.number().int().min(1).max(5),
  tags: z.array(z.string().max(40)).max(20),
  note_encrypted: z.string().nullable(),
  recorded_at: z.string().datetime().optional(),
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
    const [entry] = await db.insert(moodEntries).values({
      userId,
      moodScore: parsed.data.mood_score,
      energyLevel: parsed.data.energy_level,
      tags: parsed.data.tags,
      noteEncrypted: parsed.data.note_encrypted,
      recordedAt: parsed.data.recorded_at ?? new Date().toISOString(),
    }).returning();

    return NextResponse.json({ ok: true, entry });
  } catch {
    return NextResponse.json({ message: '保存に失敗しました' }, { status: 500 });
  }
}

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ message: '認証が必要です' }, { status: 401 });
  const userId = session.user.id;

  try {
    const entries = await db.select({
      id: moodEntries.id,
      moodScore: moodEntries.moodScore,
      energyLevel: moodEntries.energyLevel,
      tags: moodEntries.tags,
      recordedAt: moodEntries.recordedAt,
      createdAt: moodEntries.createdAt,
    })
      .from(moodEntries)
      .where(eq(moodEntries.userId, userId))
      .orderBy(desc(moodEntries.recordedAt))
      .limit(100);

    return NextResponse.json({ entries });
  } catch {
    return NextResponse.json({ message: '読み込みに失敗しました' }, { status: 500 });
  }
}
