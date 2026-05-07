'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { Card, CardLabel } from '@/components/ui/Card';
import { Sparkles } from 'lucide-react';
import { estimateCycleLength, type CycleEntry } from '@/lib/cycle';

type MoodEntry = {
  id: string;
  moodScore: number;
  energyLevel: number;
  tags: string[];
  recordedAt: string;
};

interface Insight {
  type: 'tag_low' | 'tag_high' | 'weekday' | 'trend_up' | 'trend_down' | 'cycle_luteal_low';
  text: string;
  /** 推奨の追加リンク (記事への誘導など) */
  link?: { href: string; label: string };
}

const MIN_ENTRIES = 14;
const MIN_TAG_COUNT = 4;
const MIN_WEEKDAY_COUNT = 3;
const MIN_LUTEAL_SAMPLES = 5; // 黄体期のサンプル最低数

/**
 * 軽めのパターン気づきを 1-2 個だけ表示する.
 * 設計方針:
 *  - 14 件以上記録されているときだけ動作
 *  - 「断定」ではなく「傾向があるかもしれません」程度の言葉
 *  - 利用者を責めない / ネガティブ強調しすぎない
 */
export function PatternInsights({ entries }: { entries: MoodEntry[] }) {
  const [cycleEntries, setCycleEntries] = useState<CycleEntry[]>([]);

  // サイクル機能が有効なら過去の周期を取得 (失敗・無効化時は空のまま)
  useEffect(() => {
    let cancelled = false;
    fetch('/api/cycle')
      .then((r) => r.ok ? r.json() : null)
      .then((data) => {
        if (cancelled || !data?.entries) return;
        const list: CycleEntry[] = data.entries.map((e: { id: string; startDate: string; endDate: string | null }) => ({
          id: e.id,
          startDate: e.startDate,
          endDate: e.endDate,
        }));
        setCycleEntries(list);
      })
      .catch(() => {});
    return () => { cancelled = true; };
  }, []);

  const insights = useMemo(
    () => computeInsights(entries, cycleEntries),
    [entries, cycleEntries],
  );

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
            {it.link ? (
              <>
                <br />
                <Link href={it.link.href} className="text-small text-terracotta underline">
                  {it.link.label} →
                </Link>
              </>
            ) : null}
          </li>
        ))}
      </ul>
      <p className="text-kana text-muted leading-relaxed">
        記録から見えた傾向です。「あなたが悪い」ではなく、自分のリズムを知る手がかりとして.
      </p>
    </Card>
  );
}

function computeInsights(entries: MoodEntry[], cycleEntries: CycleEntry[] = []): Insight[] {
  if (entries.length < MIN_ENTRIES) return [];

  const overallAvg = avg(entries.map((e) => e.moodScore));
  const out: Insight[] = [];

  // ----- 0. サイクル × 気分 (黄体期に下がる傾向) — 最優先で表示 -----
  const cycleInsight = computeCycleInsight(entries, cycleEntries, overallAvg);
  if (cycleInsight) out.push(cycleInsight);

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

/**
 * サイクル位相 × 気分の相関を計算する.
 * - 黄体期 (生理前 14 日) の気分が、それ以外より明確に低ければ気づきとして提示.
 * - PMS / PMDD の認識手がかりとして library 記事に誘導.
 */
function computeCycleInsight(
  entries: MoodEntry[],
  cycleEntries: CycleEntry[],
  overallAvg: number,
): Insight | null {
  if (cycleEntries.length < 2) return null; // 周期長を推定できる最低限

  const sortedCycles = [...cycleEntries].sort((a, b) => a.startDate.localeCompare(b.startDate));
  const cycleLength = estimateCycleLength(cycleEntries);

  // 各 mood entry が「黄体期 / それ以外」のどちらに該当するか分類
  const lutealScores: number[] = [];
  const otherScores: number[] = [];

  for (const m of entries) {
    const moodDate = new Date(m.recordedAt);
    const moodDateOnly = new Date(moodDate.getFullYear(), moodDate.getMonth(), moodDate.getDate());

    // 直近の生理開始日 (mood entry より前) を探す
    let lastStart: Date | null = null;
    for (const c of sortedCycles) {
      const d = new Date(c.startDate);
      if (d <= moodDateOnly) lastStart = d;
      else break;
    }
    if (!lastStart) continue;

    const dayInCycle = Math.floor(
      (moodDateOnly.getTime() - lastStart.getTime()) / (1000 * 60 * 60 * 24),
    ) + 1;

    if (dayInCycle > cycleLength + 7) continue; // 1 周期分以上経過は判定不能

    // 黄体期: 排卵 (周期長 - 14) 以降〜次の生理開始まで
    const ovulationDay = Math.max(1, cycleLength - 14);
    if (dayInCycle > ovulationDay && dayInCycle <= cycleLength) {
      lutealScores.push(m.moodScore);
    } else {
      otherScores.push(m.moodScore);
    }
  }

  if (lutealScores.length < MIN_LUTEAL_SAMPLES || otherScores.length < MIN_LUTEAL_SAMPLES) {
    return null;
  }

  const lutealMean = avg(lutealScores);
  const otherMean = avg(otherScores);
  const diff = lutealMean - otherMean;

  // 黄体期が明確に低い (差 0.5 以上) ときだけ提示
  if (diff > -0.5) return null;

  return {
    type: 'cycle_luteal_low',
    text: `生理前 (黄体期) の気分が、それ以外の時期より低めの傾向があります (黄体期 ${lutealScores.length} 件 / それ以外 ${otherScores.length} 件). PMS / PMDD と言われる、ホルモンの揺らぎと関係しているかもしれません.`,
    link: { href: '/library/pms-pmdd', label: '月経前のしんどさについて読む' },
  };
}
