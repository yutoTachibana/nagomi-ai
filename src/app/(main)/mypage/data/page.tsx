import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { DataManagement } from '@/components/mypage/DataManagement';

export default async function DataPage() {
  const session = await auth();
  if (!session?.user?.id) redirect('/login');

  return (
    <div className="px-5 pt-safe pb-4 space-y-5">
      <header className="flex items-center gap-3 pt-4">
        <Link href="/mypage" className="text-muted">
          <ArrowLeft size={20} />
        </Link>
        <h1 className="font-mincho text-h2">データの管理</h1>
      </header>

      <DataManagement />
    </div>
  );
}
