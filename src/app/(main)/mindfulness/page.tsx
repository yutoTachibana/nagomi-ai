import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { BreathingExercise } from '@/components/mindfulness/BreathingExercise';

export default function Page() {
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
        <h1 className="font-mincho text-h2">呼吸を整える</h1>
      </header>

      <p className="text-body text-muted leading-relaxed">
        完璧にやる必要はありません。<br />
        途中でやめても大丈夫です。
      </p>

      <BreathingExercise />
    </div>
  );
}
