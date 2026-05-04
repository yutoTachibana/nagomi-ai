import { NextResponse } from 'next/server';
import { z } from 'zod';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { medications } from '@/lib/db/schema';
import { eq, and, asc } from 'drizzle-orm';

const CreateBody = z.object({
  name_encrypted: z.string().min(1),
  dosage: z.string().nullable(),
  schedule: z
    .object({
      times: z.array(z.string()),
      days: z.array(z.string()),
    })
    .nullable(),
});

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ message: '認証が必要です' }, { status: 401 });
  const userId = session.user.id;

  const json = await req.json().catch(() => null);
  const parsed = CreateBody.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { message: '入力に誤りがあります', issues: parsed.error.issues },
      { status: 400 },
    );
  }

  try {
    const [medication] = await db.insert(medications).values({
      userId,
      nameEncrypted: parsed.data.name_encrypted,
      dosage: parsed.data.dosage,
      schedule: parsed.data.schedule,
      active: true,
    }).returning();

    return NextResponse.json({ ok: true, medication });
  } catch {
    return NextResponse.json({ message: '保存に失敗しました' }, { status: 500 });
  }
}

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ message: '認証が必要です' }, { status: 401 });
  const userId = session.user.id;

  try {
    const data = await db.select()
      .from(medications)
      .where(and(eq(medications.userId, userId), eq(medications.active, true)))
      .orderBy(asc(medications.createdAt));

    return NextResponse.json({ medications: data });
  } catch {
    return NextResponse.json({ message: '読み込みに失敗しました' }, { status: 500 });
  }
}
