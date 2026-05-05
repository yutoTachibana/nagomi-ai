import { NextResponse } from 'next/server';
import { z } from 'zod';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { doctorVisits } from '@/lib/db/schema';
import { eq, desc } from 'drizzle-orm';

const Body = z.object({
  visited_at: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  next_visit: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  doctor_name_encrypted: z.string().optional(),
  notes_encrypted: z.string().optional(),
});

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ message: '認証が必要です' }, { status: 401 });
  const userId = session.user.id;

  const json = await req.json().catch(() => null);
  const parsed = Body.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ message: '入力をもう一度確認してみてください' }, { status: 400 });
  }

  try {
    const [entry] = await db.insert(doctorVisits).values({
      userId,
      visitedAt: parsed.data.visited_at,
      nextVisit: parsed.data.next_visit ?? null,
      doctorNameEncrypted: parsed.data.doctor_name_encrypted ?? null,
      notesEncrypted: parsed.data.notes_encrypted ?? null,
    }).returning();

    return NextResponse.json({ ok: true, entry });
  } catch {
    return NextResponse.json({ message: '保存に失敗しました。もう一度試してみてください。' }, { status: 500 });
  }
}

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ message: '認証が必要です' }, { status: 401 });
  const userId = session.user.id;

  try {
    const entries = await db.select()
      .from(doctorVisits)
      .where(eq(doctorVisits.userId, userId))
      .orderBy(desc(doctorVisits.visitedAt))
      .limit(100);

    return NextResponse.json({ entries });
  } catch {
    return NextResponse.json({ message: '読み込みに失敗しました' }, { status: 500 });
  }
}
