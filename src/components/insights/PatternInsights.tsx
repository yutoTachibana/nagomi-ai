'use client';

import { useMemo } from 'react';
import { Card, CardLabel } from '@/components/ui/Card';
import { Sparkles } from 'lucide-react';

type MoodEntry = {
  id: string;
  moodScore: number;
  energyLevel: number;
  tags: string[];
  recordedAt: string;
};

interface Insight {
  type: 'tag_low' | 'tag_high' | 'weekday' | 'trend_up' | 'trend_down';
  text: string;
}

const MIN_ENTRIES = 14;
const MIN_TAG_COUNT = 4;
const MIN_WEEKDAY_COUNT = 3;

/**
 * 軽めのパターン気づきを 1-2 個だけ表示する.
 * 設計方針:
 *  - 14 件以上記録されているときだけ動作
 *  - 「断定」ではなく「傾向があるかもしれません」程度の言葉
 *  - 利用者を責めない / ネガティブ強調しすぎない
 */
export function PatternInsights({ entries }: { entries: MoodEntry[] }) {
  const insights = useMemo(() => computeInsights(entries), [entries]);

  if (insights.length === 0) return null;

  return (
    <Card warm className="space-y-3">
      <div className="flex items-center gap-2">
        <Sparkles size={16} className="text-terracotta" />
        <CardLabel>気づき</CardLabel>
      </div>
      <ul className="space-y-3">
        {insights.map((it, i) => (
          <li key={i} className="text-body text-ink leading-relaxed">
            {it.text}
          </li>
        ))}
      </ul>
      <p className="text-kana text-muted leading-relaxed">
        記録から見えた傾向です。「あなたが悪い」ではなく、自分のリズムを知る手がかりとして.
      </p>
    </Card>
  );
}

function computeInsights(entries: MoodEntry[]): Insight[] {
  if (entries.length < MIN_ENTRIES) return [];

  const overallAvg = avg(entries.map((e) => e.moodScore));
  const out: Insight[] = [];

  // ----- 1. タグ別気分平均 (最も差が大きいものを 1 個) -----
  const tagBuckets = new Map<string, number[]>();
  for (const e of entries) {
    for (const tag of e.tags ?? []) {
      const arr = tagBuckets.get(tag) ?? [];
      arr.push(e.moodScore);
      tagBuckets.set(tag, arr);
    }
  }

  const tagDiffs: { tag: string; diff: number; mean: number; count: number }[] = [];
  for (const [tag, scores] of tagBuckets) {
    if (scores.length < MIN_TAG_COUNT) continue;
    const mean = avg(scores);
    tagDiffs.push({ tag, diff: mean - overallAvg, mean, count: scores.length });
  }

  tagDiffs.sort((a, b) => Math.abs(b.diff) - Math.abs(a.diff));

  if (tagDiffs.length > 0 && Math.abs(tagDiffs[0].diff) >= 0.6) {
    const t = tagDiffs[0];
    if (t.diff > 0) {
      out.push({
        type: 'tag_high',
        text: `「${t.tag}」を選んだ日は、気分の平均が少し高めの傾向がありそうです (${t.count} 件).`,
      });
    } else {
      out.push({
        type: 'tag_low',
        text: `「${t.tag}」を選んだ日は、しんどさが残っていることが多いみたいです (${t.count} 件). 自分を責めなくて大丈夫です.`,
      });
    }
  }

  // ----- 2. 曜日別 (一番低い曜日があれば 1 個) -----
  const weekdayBuckets: number[][] = Array.from({ length: 7 }, () => []);
  for (const e of entries) {
    const d = new Date(e.recordedAt).getDay(); // 0=日 ... 6=土
    weekdayBuckets[d].push(e.moodScore);
  }
  const weekdayMeans = weekdayBuckets.map((bucket, i) => ({
    day: i,
    mean: bucket.length >= MIN_WEEKDAY_COUNT ? avg(bucket) : null,
    count: bucket.length,
  }));
  const validWeekdays = weekdayMeans.filter((w) => w.mean !== null);
  if (validWeekdays.length >= 4) {
    const lowest = validWeekdays.reduce((a, b) => (a.mean! < b.mean! ? a : b));
    if (lowest.mean! - overallAvg <= -0.6) {
      out.push({
        type: 'weekday',
        text: `${weekdayLabel(lowest.day)} は気分が下がりやすい傾向があるみたいです. 余裕があれば、その日のスケジュールを少しゆるめに.`,
      });
    }
  }

  // ----- 3. 直近のトレンド (最大 1 個) -----
  if (out.length < 2 && entries.length >= 21) {
    const sorted = [...entries].sort((a, b) =>
      new Date(a.recordedAt).getTime() - new Date(b.recordedAt).getTime(),
    );
    const recent = sorted.slice(-7);
    const previous = sorted.slice(-14, -7);
    if (recent.length >= 5 && previous.length >= 5) {
      const recentAvg = avg(recent.map((e) => e.moodScore));
      const prevAvg = avg(previous.map((e) => e.moodScore));
      const diff = recentAvg - prevAvg;
      if (diff >= 0.6) {
        out.push({
          type: 'trend_up',
          text: 'この 1 週間は、その前と比べて気分が少し上向きになっています.',
        });
      } else if (diff <= -0.6) {
        out.push({
          type: 'trend_down',
          text: 'この 1 週間は、少しお疲れが出ているみたいです. 無理せず、休む選択を選んでも.',
        });
      }
    }
  }

  return out.slice(0, 2);
}

function avg(arr: number[]): number {
  if (arr.length === 0) return 0;
  return arr.reduce((a, b) => a + b, 0) / arr.length;
}

function weekdayLabel(day: number): string {
  return ['日曜日', '月曜日', '火曜日', '水曜日', '木曜日', '金曜日', '土曜日'][day] ?? '';
}
