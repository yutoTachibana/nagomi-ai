'use client';

import { useEffect, useState } from 'react';
import { Card, CardLabel } from '@/components/ui/Card';
import { Flower2 } from 'lucide-react';
import Link from 'next/link';
import {
  estimatePhase,
  phaseLabel,
  formatShortDate,
  type CycleEntry,
} from '@/lib/cycle';

interface RawEntry {
  id: string;
  startDate: string;
  endDate: string | null;
}

export function CycleSummary() {
  const [enabled, setEnabled] = useState<boolean | null>(null);
  const [entries, setEntries] = useState<RawEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function init() {
      try {
        const profileRes = await fetch('/api/profile');
        if (!profileRes.ok) return;
        const data = await profileRes.json();
        const isEnabled = Boolean(data.profile?.trackCycle);
        if (cancelled) return;
        setEnabled(isEnabled);
        if (isEnabled) {
          const cycleRes = await fetch('/api/cycle');
          if (cycleRes.ok) {
            const cd = await cycleRes.json();
            if (!cancelled) setEntries(cd.entries ?? []);
          }
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    init();
    return () => { cancelled = true; };
  }, []);

  if (loading || !enabled) return null;

  if (entries.length === 0) {
    return (
      <Card className="bg-paper/40 text-center py-5">
        <Flower2 size={20} className="mx-auto text-muted/60" strokeWidth={1.4} />
        <p className="mt-2 text-small text-muted leading-relaxed">
          サイクルを記録すると、ここに位相が出ます
        </p>
        <Link href="/record/cycle" className="text-small text-terracotta mt-2 inline-block">
          記録する
        </Link>
      </Card>
    );
  }

  const cycleEntries: CycleEntry[] = entries.map((e) => ({
    id: e.id,
    startDate: e.startDate,
    endDate: e.endDate,
  }));
  const phaseInfo = estimatePhase(cycleEntries);
  if (!phaseInfo) return null;

  return (
    <Card>
      <div className="flex items-center justify-between mb-2">
        <CardLabel>いまのサイクル</CardLabel>
        <Link href="/record/cycle" className="text-kana text-muted hover:text-ink">
          記録を見る
        </Link>
      </div>
      <div className="flex items-baseline gap-3">
        <p className="font-mincho text-h3 text-ink">
          {phaseLabel(phaseInfo.phase)}
        </p>
        <p className="text-kana text-muted">
          周期 {phaseInfo.dayInCycle} 日目
        </p>
      </div>
      <p className="text-small text-muted leading-relaxed mt-2">
        次の予定: {formatShortDate(phaseInfo.nextPeriodEstimate)} あたり (推定 {phaseInfo.cycleLength} 日周期)
      </p>
    </Card>
  );
}
