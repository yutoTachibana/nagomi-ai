import { NextResponse } from 'next/server';
import { z } from 'zod';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { profiles } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

const Body = z.object({
  display_name: z.string().trim().min(1).max(40).nullable().optional(),
  diagnosis_self_report: z.array(z.string()).optional(),
  onboarding_completed: z.boolean().optional(),
  terms_accepted_version: z.string().nullable().optional(),
  terms_accepted_at: z.string().nullable().optional(),
});

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ message: '認証が必要です' }, { status: 401 });
  }

  const [profile] = await db
    .select({
      displayName: profiles.displayName,
      diagnosisSelfReport: profiles.diagnosisSelfReport,
      onboardingCompleted: profiles.onboardingCompleted,
    })
    .from(profiles)
    .where(eq(profiles.id, session.user.id))
    .limit(1);

  return NextResponse.json({ profile: profile ?? null });
}

export async function PATCH(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ message: '認証が必要です' }, { status: 401 });
  }

  const json = await req.json().catch(() => null);
  const parsed = Body.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ message: '入力に誤りがあります' }, { status: 400 });
  }

  const updates: Record<string, unknown> = {};
  if (parsed.data.display_name !== undefined) updates.displayName = parsed.data.display_name;
  if (parsed.data.diagnosis_self_report !== undefined) updates.diagnosisSelfReport = parsed.data.diagnosis_self_report;
  if (parsed.data.onboarding_completed !== undefined) updates.onboardingCompleted = parsed.data.onboarding_completed;
  if (parsed.data.terms_accepted_version !== undefined) updates.termsAcceptedVersion = parsed.data.terms_accepted_version;
  if (parsed.data.terms_accepted_at !== undefined) updates.termsAcceptedAt = parsed.data.terms_accepted_at;

  await db.update(profiles).set(updates).where(eq(profiles.id, session.user.id));

  return NextResponse.json({ ok: true });
}
