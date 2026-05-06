import { NextResponse } from 'next/server';
import { z } from 'zod';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { safetyPlans } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

const Body = z.object({
  warning_signs_encrypted: z.string().nullable().optional(),
  internal_coping_encrypted: z.string().nullable().optional(),
  social_distractions_encrypted: z.string().nullable().optional(),
  trusted_people_encrypted: z.string().nullable().optional(),
  professionals_encrypted: z.string().nullable().optional(),
  environment_encrypted: z.string().nullable().optional(),
});

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ message: '認証が必要です' }, { status: 401 });

  const [plan] = await db.select()
    .from(safetyPlans)
    .where(eq(safetyPlans.userId, session.user.id))
    .limit(1);

  return NextResponse.json({ plan: plan ?? null });
}

export async function PATCH(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ message: '認証が必要です' }, { status: 401 });
  const userId = session.user.id;

  const json = await req.json().catch(() => null);
  const parsed = Body.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ message: '入力に誤りがあります' }, { status: 400 });
  }

  const now = new Date().toISOString();
  const data = parsed.data;

  try {
    // Upsert: insert or update
    const [existing] = await db.select({ userId: safetyPlans.userId })
      .from(safetyPlans)
      .where(eq(safetyPlans.userId, userId))
      .limit(1);

    if (existing) {
      await db.update(safetyPlans).set({
        warningSignsEncrypted: data.warning_signs_encrypted ?? null,
        internalCopingEncrypted: data.internal_coping_encrypted ?? null,
        socialDistractionsEncrypted: data.social_distractions_encrypted ?? null,
        trustedPeopleEncrypted: data.trusted_people_encrypted ?? null,
        professionalsEncrypted: data.professionals_encrypted ?? null,
        environmentEncrypted: data.environment_encrypted ?? null,
        updatedAt: now,
      }).where(eq(safetyPlans.userId, userId));
    } else {
      await db.insert(safetyPlans).values({
        userId,
        warningSignsEncrypted: data.warning_signs_encrypted ?? null,
        internalCopingEncrypted: data.internal_coping_encrypted ?? null,
        socialDistractionsEncrypted: data.social_distractions_encrypted ?? null,
        trustedPeopleEncrypted: data.trusted_people_encrypted ?? null,
        professionalsEncrypted: data.professionals_encrypted ?? null,
        environmentEncrypted: data.environment_encrypted ?? null,
      });
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[safety-plan] save failed:', err);
    return NextResponse.json({ message: '保存に失敗しました' }, { status: 500 });
  }
}
