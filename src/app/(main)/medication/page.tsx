import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { MedicationManager } from '@/components/medication/MedicationManager';

export default function MedicationPage() {
  return (
    <div className="px-5 pt-safe pb-8 space-y-5">
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
    </div>
  );
}
