import { NextResponse } from 'next/server';
import { z } from 'zod';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { medicationLogs } from '@/lib/db/schema';
import { eq, desc } from 'drizzle-orm';

const LogBody = z.object({
  medication_id: z.string().uuid(),
  status: z.enum(['taken', 'skipped']),
  scheduled_for: z.string(),
  taken_at: z.string().nullable(),
  note_encrypted: z.string().nullable(),
});

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ message: '認証が必要です' }, { status: 401 });
  const userId = session.user.id;

  const json = await req.json().catch(() => null);
  const parsed = LogBody.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { message: '入力に誤りがあります', issues: parsed.error.issues },
      { status: 400 },
    );
  }

  try {
    const [log] = await db.insert(medicationLogs).values({
      userId,
      medicationId: parsed.data.medication_id,
      scheduledFor: parsed.data.scheduled_for,
      takenAt: parsed.data.taken_at ?? null,
      status: parsed.data.status,
      noteEncrypted: parsed.data.note_encrypted,
    }).returning();

    return NextResponse.json({ ok: true, log });
  } catch {
    return NextResponse.json({ message: '保存に失敗しました' }, { status: 500 });
  }
}

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ message: '認証が必要です' }, { status: 401 });
  const userId = session.user.id;

  try {
    const logs = await db.select()
      .from(medicationLogs)
      .where(eq(medicationLogs.userId, userId))
      .orderBy(desc(medicationLogs.scheduledFor))
      .limit(100);

    return NextResponse.json({ logs });
  } catch {
    return NextResponse.json({ message: '読み込みに失敗しました' }, { status: 500 });
  }
}
