'use client';

import Link from 'next/link';
import { LifeBuoy } from 'lucide-react';

/**
 * 緊急サポートへのアクセスボタン.
 * 全画面で右下に固定. ボトムナビの上に重ねる.
 *
 * 「目立たないが見つけられる」を目指す:
 * - 警告色を使わない (利用者を刺激しない)
 * - 「緊急」という言葉も避ける. 「サポート」の表記
 */
export function CrisisFab() {
  return (
    <Link
      href="/crisis"
      aria-label="サポートが必要なときはこちら"
      className="
        fixed bottom-20 right-4 z-40
        flex h-12 w-12 items-center justify-center rounded-full
        bg-card border border-plum/30 shadow-soft
        text-plum
        hover:bg-plum hover:text-white transition-colors
      "
    >
      <LifeBuoy size={22} strokeWidth={1.75} />
    </Link>
  );
}
