import Link from 'next/link';
import { Settings, Pill, Stethoscope, Bell, Lock, FileText, LogOut } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { profiles } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

export default async function MyPage() {
  const session = await auth();
  const [profile] = await db
    .select({ displayName: profiles.displayName })
    .from(profiles)
    .where(eq(profiles.id, session!.user.id))
    .limit(1);

  return (
    <div className="px-5 pt-safe pb-8 space-y-5">
      <header className="pt-4">
        <p className="text-kana uppercase tracking-widest text-muted">MY PAGE</p>
        <h1 className="mt-1 font-mincho text-h1">{profile?.displayName ?? 'あなた'}</h1>
      </header>

      <Card>
        <ul className="divide-y divide-accent-soft">
          <MyPageItem href="/medication" Icon={Pill} label="服薬の記録" hint="お薬の管理" />
          <MyPageItem href="/mypage/visits" Icon={Stethoscope} label="通院の記録" hint="次回の予定など" />
          <MyPageItem href="/mypage/notifications" Icon={Bell} label="通知設定" hint="お知らせのタイミング" />
          <MyPageItem href="/mypage/security" Icon={Lock} label="セキュリティ" hint="パスワードと暗号化" />
          <MyPageItem href="/mypage/data" Icon={FileText} label="データの管理" hint="エクスポート・削除" />
          <MyPageItem href="/mypage/settings" Icon={Settings} label="設定" hint="表示やテーマ" />
        </ul>
      </Card>

      <Card>
        <form action="/api/auth/logout" method="post">
          <button className="flex items-center gap-3 text-body text-muted">
            <LogOut size={18} />
            ログアウト
          </button>
        </form>
      </Card>

      <p className="text-center text-kana text-muted">
        Version 0.2.0 (Phase 1)
      </p>
    </div>
  );
}

function MyPageItem({ href, Icon, label, hint }: { href: string; Icon: React.ComponentType<{ size?: number; className?: string }>; label: string; hint: string }) {
  return (
    <li>
      <Link href={href} className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
        <Icon size={18} className="text-muted" />
        <div className="flex-1">
          <p className="text-body">{label}</p>
          <p className="text-kana text-muted">{hint}</p>
        </div>
        <span className="text-muted">›</span>
      </Link>
    </li>
  );
}
