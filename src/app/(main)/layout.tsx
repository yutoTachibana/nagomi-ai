import { BottomNav } from '@/components/layout/BottomNav';
import { CrisisFab } from '@/components/layout/CrisisFab';

/**
 * メインレイアウト.
 *
 * body スクロール + 固定 BottomNav (モバイル Web の標準パターン).
 *  - 短いページでも iOS rubber-band の不自然な余白が出ない
 *  - 長いページは body が自然にスクロール
 *  - BottomNav は fixed bottom-0 で常にビューポート最下部
 *  - main の pb で nav 分の余白を確保し、コンテンツが nav に隠れないようにする
 *  - Chat 画面は独自に h-[calc(100dvh-var(--nav-h))] で nav を避ける
 */
export default function MainLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto max-w-md">
      <main style={{ paddingBottom: 'var(--nav-h)' }}>{children}</main>
      <CrisisFab />
      <BottomNav />
    </div>
  );
}
