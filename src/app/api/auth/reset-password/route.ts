import { NextResponse } from 'next/server';
import { z } from 'zod';
import bcrypt from 'bcryptjs';
import { db } from '@/lib/db';
import { users, passwordResetTokens } from '@/lib/db/schema';
import { eq, and, gt, isNull } from 'drizzle-orm';

const Body = z.object({
  token: z.string().min(1),
  password: z.string().min(8),
});

export async function POST(req: Request) {
  const json = await req.json().catch(() => null);
  const parsed = Body.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { message: '入力に誤りがあります。もう一度お試しください。' },
      { status: 400 },
    );
  }

  // Find valid, unused, non-expired token
  const [record] = await db
    .select()
    .from(passwordResetTokens)
    .where(
      and(
        eq(passwordResetTokens.token, parsed.data.token),
        gt(passwordResetTokens.expiresAt, new Date().toISOString()),
        isNull(passwordResetTokens.usedAt),
      ),
    )
    .limit(1);

  if (!record) {
    return NextResponse.json(
      { message: 'リンクが無効か期限切れです。もう一度お試しください。' },
      { status: 400 },
    );
  }

  const passwordHash = await bcrypt.hash(parsed.data.password, 12);

  // Update user password
  await db
    .update(users)
    .set({ passwordHash, updatedAt: new Date().toISOString() })
    .where(eq(users.id, record.userId));

  // Mark token as used
  await db
    .update(passwordResetTokens)
    .set({ usedAt: new Date().toISOString() })
    .where(eq(passwordResetTokens.id, record.id));

  return NextResponse.json({ ok: true });
}
