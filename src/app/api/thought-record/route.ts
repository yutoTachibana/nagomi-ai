import { NextResponse } from 'next/server';
import { z } from 'zod';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { thoughtRecords } from '@/lib/db/schema';
import { eq, desc } from 'drizzle-orm';

const Emotion = z.object({
  name: z.string().min(1).max(40),
  intensity: z.number().int().min(0).max(100),
});

const Body = z.object({
  situation_encrypted: z.string().nullable(),
  emotions_before: z.array(Emotion).nullable(),
  automatic_thought_encrypted: z.string().nullable(),
  evidence_for_encrypted: z.string().nullable(),
  evidence_against_encrypted: z.string().nullable(),
  balanced_thought_encrypted: z.string().nullable(),
  emotions_after: z.array(Emotion).nullable(),
  cognitive_distortions: z.array(z.string()).max(20),
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
    const [record] = await db.insert(thoughtRecords).values({
      userId,
      situationEncrypted: parsed.data.situation_encrypted,
      emotionsBefore: parsed.data.emotions_before,
      automaticThoughtEncrypted: parsed.data.automatic_thought_encrypted,
      evidenceForEncrypted: parsed.data.evidence_for_encrypted,
      evidenceAgainstEncrypted: parsed.data.evidence_against_encrypted,
      balancedThoughtEncrypted: parsed.data.balanced_thought_encrypted,
      emotionsAfter: parsed.data.emotions_after,
      cognitiveDistortions: parsed.data.cognitive_distortions,
    }).returning();

    return NextResponse.json({ ok: true, record });
  } catch {
    return NextResponse.json({ message: '保存に失敗しました' }, { status: 500 });
  }
}

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ message: '認証が必要です' }, { status: 401 });
  const userId = session.user.id;

  try {
    const records = await db.select()
      .from(thoughtRecords)
      .where(eq(thoughtRecords.userId, userId))
      .orderBy(desc(thoughtRecords.createdAt))
      .limit(50);

    return NextResponse.json({ records });
  } catch {
    return NextResponse.json({ message: '読み込みに失敗しました' }, { status: 500 });
  }
}
