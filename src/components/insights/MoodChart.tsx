'use client';

import { useState, useMemo } from 'react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
} from 'recharts';
import { format, subDays, isAfter } from 'date-fns';
import { moodLabel, energyLabel } from '@/lib/utils';
import { Card, CardLabel } from '@/components/ui/Card';

type MoodEntry = {
  id: string;
  moodScore: number;
  energyLevel: number;
  tags: string[];
  recordedAt: Date;
};

type Period = 30 | 90;

function CustomTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: { value: number; dataKey: string; color: string }[];
  label?: string;
}) {
  if (!active || !payload || payload.length === 0) return null;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const point = (payload[0] as any)?.payload as { date: string; moodScore: number; energyLevel: number } | undefined;
  if (!point) return null;

  return (
    <div className="card px-3 py-2 text-small shadow-md">
      <p className="text-muted mb-1">{point.date}</p>
      {point.moodScore != null && (
        <p className="text-ink">
          <span className="inline-block w-2 h-2 rounded-full bg-terracotta mr-1.5" />
          気分: {moodLabel(point.moodScore as 1 | 2 | 3 | 4 | 5)}
        </p>
      )}
      {point.energyLevel != null && (
        <p className="text-ink">
          <span className="inline-block w-2 h-2 rounded-full bg-sage mr-1.5" />
          エネルギー: {energyLabel(point.energyLevel as 1 | 2 | 3 | 4 | 5)}
        </p>
      )}
    </div>
  );
}

const yTickLabels: Record<number, string> = {
  1: 'しんどい',
  2: '',
  3: 'ふつう',
  4: '',
  5: 'のびやか',
};

export function MoodChart({ entries }: { entries: MoodEntry[] }) {
  const [period, setPeriod] = useState<Period>(30);

  const chartData = useMemo(() => {
    const cutoff = subDays(new Date(), period);
    return entries
      .filter((e) => isAfter(new Date(e.recordedAt), cutoff))
      .sort(
        (a, b) =>
          new Date(a.recordedAt).getTime() - new Date(b.recordedAt).getTime(),
      )
      .map((e) => ({
        date: format(new Date(e.recordedAt), 'M/d'),
        moodScore: e.moodScore,
        energyLevel: e.energyLevel,
      }));
  }, [entries, period]);

  if (entries.length === 0) {
    return (
      <Card className="py-8 text-center">
        <p className="text-body text-ink/70 leading-loose">
          まだ記録がありません。<br />
          気分を記録すると、ここに自分のリズムが見えてきます。
        </p>
      </Card>
    );
  }

  return (
    <Card>
      <div className="flex items-center justify-between mb-4">
        <CardLabel>気分とエネルギーの推移</CardLabel>
        <div className="flex gap-1">
          {([30, 90] as const).map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`px-3 py-1 rounded-pill text-kana transition-colors ${
                period === p
                  ? 'bg-terracotta/15 text-terracotta'
                  : 'text-muted hover:bg-accent-soft/40'
              }`}
            >
              {p}日
            </button>
          ))}
        </div>
      </div>

      {chartData.length === 0 ? (
        <p className="text-small text-muted text-center py-6">
          この期間にはまだ記録がありません。
        </p>
      ) : (
        <ResponsiveContainer width="100%" height={220}>
          <LineChart
            data={chartData}
            margin={{ top: 8, right: 8, bottom: 0, left: -16 }}
          >
            <XAxis
              dataKey="date"
              tick={{ fontSize: 11, fill: '#6b6864' }}
              axisLine={false}
              tickLine={false}
              interval="preserveStartEnd"
            />
            <YAxis
              domain={[1, 5]}
              ticks={[1, 2, 3, 4, 5]}
              tickFormatter={(v: number) => yTickLabels[v] ?? ''}
              tick={{ fontSize: 11, fill: '#6b6864' }}
              axisLine={false}
              tickLine={false}
              width={56}
            />
            <Tooltip content={<CustomTooltip />} />
            <Line
              type="monotone"
              dataKey="moodScore"
              stroke="#c47a5a"
              strokeWidth={2}
              dot={{ r: 3, fill: '#c47a5a', strokeWidth: 0 }}
              activeDot={{ r: 5, fill: '#c47a5a', strokeWidth: 0 }}
              name="気分"
            />
            <Line
              type="monotone"
              dataKey="energyLevel"
              stroke="#7a8c6e"
              strokeWidth={2}
              dot={{ r: 3, fill: '#7a8c6e', strokeWidth: 0 }}
              activeDot={{ r: 5, fill: '#7a8c6e', strokeWidth: 0 }}
              name="エネルギー"
            />
          </LineChart>
        </ResponsiveContainer>
      )}

      {/* Legend */}
      <div className="flex items-center justify-center gap-5 mt-3 text-kana text-muted">
        <span className="flex items-center gap-1.5">
          <span className="inline-block w-2.5 h-0.5 rounded-full bg-terracotta" />
          気分
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block w-2.5 h-0.5 rounded-full bg-sage" />
          エネルギー
        </span>
      </div>
    </Card>
  );
}
