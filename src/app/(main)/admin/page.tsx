import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { users } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { redirect } from 'next/navigation';
import { AdminPanel } from '@/components/admin/AdminPanel';

export default async function AdminPage() {
  const session = await auth();
  if (!session?.user?.id) redirect('/login');

  const [user] = await db
    .select({ role: users.role })
    .from(users)
    .where(eq(users.id, session.user.id))
    .limit(1);

  if (user?.role !== 'admin') redirect('/home');

  return <AdminPanel />;
}
