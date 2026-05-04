import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { emailVerificationTokens, users } from '@/lib/db/schema';
import { eq, and, gt } from 'drizzle-orm';

export async function GET(req: Request) {
  const url = new URL(req.url);
  const token = url.searchParams.get('token');

  if (!token) {
    return NextResponse.redirect(new URL('/login?error=invalid-token', url.origin));
  }

  // Find valid (non-expired) token
  const [record] = await db
    .select()
    .from(emailVerificationTokens)
    .where(
      and(
        eq(emailVerificationTokens.token, token),
        gt(emailVerificationTokens.expiresAt, new Date()),
      ),
    )
    .limit(1);

  if (!record) {
    return NextResponse.redirect(new URL('/login?error=invalid-token', url.origin));
  }

  // Mark user as verified
  await db
    .update(users)
    .set({ emailVerified: true, updatedAt: new Date() })
    .where(eq(users.id, record.userId));

  // Delete the used token
  await db
    .delete(emailVerificationTokens)
    .where(eq(emailVerificationTokens.id, record.id));

  return NextResponse.redirect(new URL('/login?verified=true', url.origin));
}
