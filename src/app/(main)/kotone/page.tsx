import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { conversations } from '@/lib/db/schema';
import { eq, desc } from 'drizzle-orm';
import { redirect } from 'next/navigation';
import { KotoneLayout } from '@/components/kotone/KotoneLayout';

export default async function KotonePage() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect('/login');
  }

  const convList = await db
    .select({
      id: conversations.id,
      title: conversations.title,
      updatedAt: conversations.updatedAt,
    })
    .from(conversations)
    .where(eq(conversations.userId, session.user.id))
    .orderBy(desc(conversations.updatedAt))
    .limit(50);

  return <KotoneLayout conversations={convList} />;
}
