import Link from 'next/link';
import { ArrowLeft, ChevronRight, Activity } from 'lucide-react';
import { MedicationManager } from '@/components/medication/MedicationManager';
import { Card, CardLabel } from '@/components/ui/Card';

export default function MedicationPage() {
  return (
    <div className="px-5 pt-safe pb-4 space-y-5">
      <header className="flex items-center gap-2 pt-4">
        <Link
          href="/home"
          aria-label="戻る"
          className="p-2 -ml-2 rounded-pill hover:bg-accent-soft/40"
        >
          <ArrowLeft size={20} />
        </Link>
        <h1 className="font-mincho text-h2">服薬の記録</h1>
      </header>

      <p className="text-small text-muted leading-relaxed">
        飲めた日も、飲めなかった日も、どちらもそのまま。
      </p>

      <MedicationManager />

      <Link href="/medication/side-effects" className="block">
        <Card className="hover:bg-accent-soft/30 transition-colors">
          <div className="flex items-start gap-3">
            <div className="rounded-full bg-plum/10 p-2.5 mt-0.5">
              <Activity size={18} className="text-plum" />
            </div>
            <div className="flex-1 min-w-0">
              <CardLabel>気になることの記録</CardLabel>
              <p className="mt-1 text-body text-ink">体や気持ちの違和感をメモする</p>
              <p className="mt-1 text-kana text-muted">
                次の診察で主治医と整理できます
              </p>
            </div>
            <ChevronRight size={18} className="text-muted shrink-0 mt-1" />
          </div>
        </Card>
      </Link>
    </div>
  );
}
