'use client';

import { useEffect, useMemo, useState } from 'react';
import { Card, CardLabel } from '@/components/ui/Card';
import { Moon } from 'lucide-react';

interface SleepEntry {
  id: string;
  recordedDate: string;
  bedtime: string | null;
  wakeTime: string | null;
  qualityScore: number | null;
  createdAt: string;
}

function durationHours(bedtime: string | null, wake: string | null): number | null {
  if (!bedtime || !wake) return null;
  const a = new Date(bedtime).getTime();
  const b = new Date(wake).getTime();
  if (Number.isNaN(a) || Number.isNaN(b)) return null;
  const diffH = (b - a) / 1000 / 60 / 60;
  if (diffH <= 0 || diffH > 24) return null;
  return Math.round(diffH * 10) / 10;
}

const QUALITY_LABEL: Record<number, string> = {
  1: '眠れなかった',
  2: '浅かった',
  3: 'ふつう',
  4: 'よく眠れた',
  5: 'ぐっすり',
};

export function SleepSummary() {
  const [entries, setEntries] = useState<SleepEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/sleep')
      .then((r) => r.ok ? r.json() : null)
      .then((data) => {
        if (data?.entries) setEntries(data.entries.slice(0, 14)); // 直近14件
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const stats = useMemo(() => {
    const durations = entries
      .map((e) => durationHours(e.bedtime, e.wakeTime))
      .filter((d): d is number => d !== null);
    const qualities = entries
      .map((e) => e.qualityScore)
      .filter((q): q is number => q !== null);
    return {
      avgDuration: durations.length > 0
        ? Math.round((durations.reduce((a, b) => a + b, 0) / durations.length) * 10) / 10
        : null,
      avgQuality: qualities.length > 0
        ? Math.round((qualities.reduce((a, b) => a + b, 0) / qualities.length) * 10) / 10
        : null,
      count: entries.length,
    };
  }, [entries]);

  if (loading) return null;

  if (entries.length === 0) {
    return (
      <Card className="text-center py-6 bg-paper/40">
        <Moon size={24} className="mx-auto text-muted/50" strokeWidth={1.4} />
        <p className="mt-2 text-small text-muted leading-relaxed">
          睡眠を記録すると、ここに表示されます。<br />
          気分の波と並べて見ると、リズムが見えてきます。
        </p>
      </Card>
    );
  }

  return (
    <Card>
      <div className="flex items-center justify-between mb-3">
        <CardLabel>最近の睡眠</CardLabel>
        <span className="text-kana text-muted">{stats.count} 件</span>
      </div>

      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="rounded-card bg-accent-soft/40 px-3 py-2.5">
          <p className="text-kana text-muted">平均の長さ</p>
          <p className="font-mincho text-h3 text-ink mt-1">
            {stats.avgDuration ? `${stats.avgDuration}h` : '—'}
          </p>
        </div>
        <div className="rounded-card bg-accent-soft/40 px-3 py-2.5">
          <p className="text-kana text-muted">平均の感じ</p>
          <p className="font-mincho text-h3 text-ink mt-1">
            {stats.avgQuality ? stats.avgQuality.toFixed(1) : '—'}
            <span className="text-small text-muted ml-1">/ 5</span>
          </p>
        </div>
      </div>

      <div className="space-y-1.5">
        {entries.slice(0, 7).map((e) => {
          const dur = durationHours(e.bedtime, e.wakeTime);
          return (
            <div key={e.id} className="flex items-center gap-3 text-small">
              <span className="text-muted whitespace-nowrap w-16 shrink-0">
                {formatDate(e.recordedDate)}
              </span>
              <span className="text-ink flex-1 min-w-0 truncate">
                {dur ? `${dur}h` : '時刻なし'}
                {e.qualityScore ? ` · ${QUALITY_LABEL[e.qualityScore]}` : ''}
              </span>
              {e.qualityScore ? (
                <div className="flex gap-0.5 shrink-0">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <span
                      key={s}
                      className={`inline-block h-1.5 w-1.5 rounded-full ${s <= e.qualityScore! ? 'bg-terracotta/70' : 'bg-accent-soft'}`}
                    />
                  ))}
                </div>
              ) : null}
            </div>
          );
        })}
      </div>
    </Card>
  );
}

function formatDate(dateStr: string): string {
  const [, m, d] = dateStr.split('-');
  return `${Number(m)}/${Number(d)}`;
}
