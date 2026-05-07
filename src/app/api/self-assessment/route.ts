import { NextResponse } from 'next/server';
import { z } from 'zod';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { selfAssessments } from '@/lib/db/schema';
import { eq, desc } from 'drizzle-orm';

// PHQ-9 / GAD-7 は 0-3 リッカート, ECR-S は 1-7 リッカート
const Body = z.discriminatedUnion('scale_type', [
  z.object({
    scale_type: z.literal('phq9'),
    item_scores: z.array(z.number().int().min(0).max(3)).length(9),
  }),
  z.object({
    scale_type: z.literal('gad7'),
    item_scores: z.array(z.number().int().min(0).max(3)).length(7),
  }),
  z.object({
    scale_type: z.literal('ecrs'),
    item_scores: z.array(z.number().int().min(1).max(7)).length(12),
  }),
]);

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ message: '認証が必要です' }, { status: 401 });
  const userId = session.user.id;

  try {
    const entries = await db.select()
      .from(selfAssessments)
      .where(eq(selfAssessments.userId, userId))
      .orderBy(desc(selfAssessments.completedAt))
      .limit(30);
    return NextResponse.json({ entries });
  } catch (err) {
    console.error('[self-assessment] select failed:', err);
    return NextResponse.json({ message: '読み込みに失敗しました' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ message: '認証が必要です' }, { status: 401 });
  const userId = session.user.id;

  const json = await req.json().catch(() => null);
  const parsed = Body.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ message: '入力に誤りがあります' }, { status: 400 });
  }

  // total_score は ECR-S では参考値 (実際の解釈は 2 軸)
  const totalScore = parsed.data.item_scores.reduce((a, b) => a + b, 0);

  try {
    const [entry] = await db.insert(selfAssessments).values({
      userId,
      scaleType: parsed.data.scale_type,
      totalScore,
      itemScores: parsed.data.item_scores,
    }).returning();
    return NextResponse.json({ ok: true, entry });
  } catch (err) {
    console.error('[self-assessment] insert failed:', err);
    return NextResponse.json({ message: '保存に失敗しました' }, { status: 500 });
  }
}
