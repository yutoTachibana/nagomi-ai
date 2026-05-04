import { BottomNav } from '@/components/layout/BottomNav';
import { CrisisFab } from '@/components/layout/CrisisFab';

export default function MainLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto flex min-h-screen max-w-md flex-col">
      <main className="flex-1">{children}</main>
      <CrisisFab />
      <BottomNav />
    </div>
  );
}
