import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { z } from 'zod';
import { db } from '@/lib/db';
import { users, passwordResetTokens } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { sendPasswordResetEmail } from '@/lib/email';
import { checkRateLimit, getClientIp } from '@/lib/rate-limit';

const Body = z.object({
  email: z.string().email(),
});

export async function POST(req: Request) {
  const ip = getClientIp(req);
  const rl = checkRateLimit(`forgot-password:${ip}`, 3, 60 * 60 * 1000);
  if (!rl.allowed) {
    return NextResponse.json(
      { message: '少し時間をおいて、もう一度お試しください。' },
      { status: 429 },
    );
  }

  const json = await req.json().catch(() => null);
  const parsed = Body.safeParse(json);
  if (!parsed.success) {
    // Don't leak validation details — return generic success
    return NextResponse.json({ ok: true, message: 'メールを送信しました' });
  }

  const [user] = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.email, parsed.data.email))
    .limit(1);

  // Always return success to avoid leaking user existence
  if (!user) {
    return NextResponse.json({ ok: true, message: 'メールを送信しました' });
  }

  const token = crypto.randomBytes(32).toString('hex');
  await db.insert(passwordResetTokens).values({
    userId: user.id,
    token,
    expiresAt: new Date(Date.now() + 60 * 60 * 1000).toISOString(), // 1 hour
  });

  await sendPasswordResetEmail(parsed.data.email, token).catch(() => {});

  return NextResponse.json({ ok: true, message: 'メールを送信しました' });
}
