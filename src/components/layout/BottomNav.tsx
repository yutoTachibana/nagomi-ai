'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, NotebookPen, MessageCircleHeart, LineChart, User } from 'lucide-react';
import { cn } from '@/lib/utils';

const tabs = [
  { href: '/home', label: 'ホーム', Icon: Home },
  { href: '/record', label: '記録', Icon: NotebookPen },
  { href: '/kotone', label: 'ことね', Icon: MessageCircleHeart },
  { href: '/insights', label: 'みつめる', Icon: LineChart },
  { href: '/mypage', label: 'マイページ', Icon: User },
] as const;

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="メインナビゲーション"
      className="z-30 border-t border-accent-soft bg-card/95 backdrop-blur-md pb-safe"
    >
      <ul className="grid grid-cols-5">
        {tabs.map(({ href, label, Icon }) => {
          const active =
            pathname === href ||
            (href !== '/home' && pathname.startsWith(href));
          return (
            <li key={href}>
              <Link
                href={href}
                className={cn(
                  'flex flex-col items-center justify-center gap-1 px-1 py-2 text-kana transition-colors',
                  active ? 'text-terracotta' : 'text-muted',
                )}
                aria-current={active ? 'page' : undefined}
              >
                <Icon
                  size={22}
                  strokeWidth={active ? 2 : 1.5}
                  aria-hidden="true"
                />
                <span className="text-[11px] leading-none">{label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
