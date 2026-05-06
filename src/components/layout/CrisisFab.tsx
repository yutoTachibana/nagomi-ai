'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LifeBuoy } from 'lucide-react';

/**
 * 緊急サポートへのアクセスボタン.
 * 全画面で右下に固定. ボトムナビの上に重ねる.
 *
 * 「目立たないが見つけられる」を目指す:
 * - 警告色を使わない (利用者を刺激しない)
 * - 「緊急」という言葉も避ける. 「サポート」の表記
 *
 * /kotone ではチャット入力エリアと干渉するため非表示.
 * 代わりにチャットヘッダーにサポートリンクを置く.
 * /crisis では FAB を表示しても無意味なので非表示.
 */
export function CrisisFab() {
  const pathname = usePathname();
  if (pathname?.startsWith('/kotone') || pathname?.startsWith('/crisis')) {
    return null;
  }

  return (
    <Link
      href="/crisis"
      aria-label="サポートが必要なときはこちら"
      className="
        fixed bottom-20 right-4 z-40
        flex h-11 w-11 items-center justify-center rounded-full
        bg-card/90 backdrop-blur border border-plum/25 shadow-soft
        text-plum/80
        hover:bg-plum hover:text-white hover:border-plum transition-colors
      "
    >
      <LifeBuoy size={20} strokeWidth={1.75} />
    </Link>
  );
}
