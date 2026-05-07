import { NextResponse } from 'next/server';
import { z } from 'zod';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { cycleEntries } from '@/lib/db/schema';
import { eq, and, desc } from 'drizzle-orm';

const DateOnly = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);

const CreateBody = z.object({
  start_date: DateOnly,
  end_date: DateOnly.nullable().optional(),
  note_encrypted: z.string().nullable().optional(),
});

const UpdateBody = z.object({
  id: z.string().uuid(),
  start_date: DateOnly.optional(),
  end_date: DateOnly.nullable().optional(),
  note_encrypted: z.string().nullable().optional(),
});

const DeleteBody = z.object({
  id: z.string().uuid(),
});

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ message: '認証が必要です' }, { status: 401 });
  const userId = session.user.id;

  try {
    const entries = await db.select()
      .from(cycleEntries)
      .where(eq(cycleEntries.userId, userId))
      .orderBy(desc(cycleEntries.startDate))
      .limit(60);
    return NextResponse.json({ entries });
  } catch (err) {
    console.error('[cycle] select failed:', err);
    return NextResponse.json({ message: '読み込みに失敗しました' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ message: '認証が必要です' }, { status: 401 });
  const userId = session.user.id;

  const json = await req.json().catch(() => null);
  const parsed = CreateBody.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ message: '入力に誤りがあります' }, { status: 400 });
  }

  try {
    const [entry] = await db.insert(cycleEntries).values({
      userId,
      startDate: parsed.data.start_date,
      endDate: parsed.data.end_date ?? null,
      noteEncrypted: parsed.data.note_encrypted ?? null,
    }).returning();
    return NextResponse.json({ ok: true, entry });
  } catch (err) {
    console.error('[cycle] insert failed:', err);
    return NextResponse.json({ message: '保存に失敗しました' }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ message: '認証が必要です' }, { status: 401 });
  const userId = session.user.id;

  const json = await req.json().catch(() => null);
  const parsed = UpdateBody.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ message: '入力に誤りがあります' }, { status: 400 });
  }

  const updates: Record<string, unknown> = { updatedAt: new Date().toISOString() };
  if (parsed.data.start_date !== undefined) updates.startDate = parsed.data.start_date;
  if (parsed.data.end_date !== undefined) updates.endDate = parsed.data.end_date;
  if (parsed.data.note_encrypted !== undefined) updates.noteEncrypted = parsed.data.note_encrypted;

  try {
    await db.update(cycleEntries)
      .set(updates)
      .where(and(eq(cycleEntries.id, parsed.data.id), eq(cycleEntries.userId, userId)));
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[cycle] update failed:', err);
    return NextResponse.json({ message: '更新に失敗しました' }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ message: '認証が必要です' }, { status: 401 });
  const userId = session.user.id;

  const json = await req.json().catch(() => null);
  const parsed = DeleteBody.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ message: '入力に誤りがあります' }, { status: 400 });
  }

  try {
    await db.delete(cycleEntries)
      .where(and(eq(cycleEntries.id, parsed.data.id), eq(cycleEntries.userId, userId)));
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[cycle] delete failed:', err);
    return NextResponse.json({ message: '削除に失敗しました' }, { status: 500 });
  }
}
