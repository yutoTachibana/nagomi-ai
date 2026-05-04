import { NextResponse } from 'next/server';
import { z } from 'zod';
import bcrypt from 'bcryptjs';
import { db } from '@/lib/db';
import { users, profiles } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

const Body = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

export async function POST(req: Request) {
  const json = await req.json().catch(() => null);
  const parsed = Body.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ message: '入力に誤りがあります' }, { status: 400 });
  }

  // Check for existing user
  const [existing] = await db.select({ id: users.id }).from(users).where(eq(users.email, parsed.data.email)).limit(1);
  if (existing) {
    return NextResponse.json({ message: 'このメールアドレスは既に登録されています' }, { status: 409 });
  }

  const passwordHash = await bcrypt.hash(parsed.data.password, 12);
  const [user] = await db.insert(users).values({
    email: parsed.data.email,
    passwordHash,
  }).returning();

  // Create profile (replaces Supabase's handle_new_user trigger)
  await db.insert(profiles).values({ id: user.id });

  return NextResponse.json({ ok: true, userId: user.id });
}
