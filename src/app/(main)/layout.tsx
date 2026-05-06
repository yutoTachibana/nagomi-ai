import { BottomNav } from '@/components/layout/BottomNav';
import { CrisisFab } from '@/components/layout/CrisisFab';

/**
 * メインレイアウト.
 *
 * ビューポートを 100dvh で固定し、main を内部スクロールにする.
 * これにより:
 *  - BottomNav が常にビューポート最下部に居続ける (短いページでも長いページでも)
 *  - チャット画面の入力エリアがナビに隠されない
 *  - 子ページは main 内でスクロール
 */
export default function MainLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto flex h-[100dvh] max-w-md flex-col">
      <main className="flex-1 min-h-0 overflow-y-auto">{children}</main>
      <CrisisFab />
      <BottomNav />
    </div>
  );
}
