import { NextResponse } from 'next/server';
import { z } from 'zod';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { medicationSideEffects } from '@/lib/db/schema';
import { eq, desc } from 'drizzle-orm';

const Body = z.object({
  medication_id: z.string().uuid().nullable().optional(),
  effect_type: z.string().min(1).max(50),
  severity: z.number().int().min(1).max(5).nullable().optional(),
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
    const [entry] = await db.insert(medicationSideEffects).values({
      userId,
      medicationId: parsed.data.medication_id ?? null,
      effectType: parsed.data.effect_type,
      severity: parsed.data.severity ?? null,
      noteEncrypted: parsed.data.note_encrypted ?? null,
    }).returning();

    return NextResponse.json({ ok: true, entry });
  } catch (err) {
    console.error('[side-effects] insert failed:', err);
    return NextResponse.json({ message: '保存に失敗しました' }, { status: 500 });
  }
}

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ message: '認証が必要です' }, { status: 401 });
  const userId = session.user.id;

  try {
    const entries = await db.select()
      .from(medicationSideEffects)
      .where(eq(medicationSideEffects.userId, userId))
      .orderBy(desc(medicationSideEffects.recordedAt))
      .limit(100);

    return NextResponse.json({ entries });
  } catch (err) {
    console.error('[side-effects] select failed:', err);
    return NextResponse.json({ message: '読み込みに失敗しました' }, { status: 500 });
  }
}
