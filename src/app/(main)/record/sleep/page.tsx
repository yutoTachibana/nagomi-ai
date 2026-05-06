'use client';

import * as React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Moon } from 'lucide-react';
import { Card, CardLabel } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Textarea } from '@/components/ui/Textarea';
import { encrypt } from '@/lib/crypto';
import { cn } from '@/lib/utils';

const QUALITY_OPTIONS: { score: number; label: string }[] = [
  { score: 1, label: '眠れなかった' },
  { score: 2, label: '浅かった' },
  { score: 3, label: 'ふつう' },
  { score: 4, label: 'よく眠れた' },
  { score: 5, label: 'ぐっすり' },
];

function todayDateString(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export default function SleepRecordPage() {
  const router = useRouter();
  const [date, setDate] = React.useState(todayDateString());
  const [bedtime, setBedtime] = React.useState('');
  const [wakeTime, setWakeTime] = React.useState('');
  const [quality, setQuality] = React.useState<number | null>(null);
  const [note, setNote] = React.useState('');
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  async function handleSubmit() {
    setSaving(true);
    setError(null);
    try {
      // Convert HH:mm to ISO datetime relative to recorded_date
      const bedtimeIso = bedtime ? buildIso(date, bedtime, true) : null;
      const wakeIso = wakeTime ? buildIso(date, wakeTime, false) : null;
      const noteEnc = note.trim() ? await encrypt(note.trim()) : null;

      const res = await fetch('/api/sleep', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          recorded_date: date,
          bedtime: bedtimeIso,
          wake_time: wakeIso,
          quality_score: quality,
          note_encrypted: noteEnc,
        }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.message ?? '保存できませんでした');
      }
      router.push('/insights');
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : '保存できませんでした');
    } finally {
      setSaving(false);
    }
  }

  /**
   * recorded_date は「起床日」前提.
   * - 寝た時刻 (bedtime): 起床日の前日 (深夜含むため判定簡略化)、または当日早朝
   * - 起きた時刻 (wakeTime): 起床日の朝
   * シンプル化のため、bedtime は前日扱い (22-翌朝3時想定), wake は当日扱い.
   */
  function buildIso(dateStr: string, hhmm: string, isBedtime: boolean): string {
    const [year, month, day] = dateStr.split('-').map(Number);
    const [h, m] = hhmm.split(':').map(Number);
    const d = new Date(year, month - 1, day, h, m, 0);
    if (isBedtime && h >= 12) {
      // 寝た時刻が午後 → 前日扱い
      d.setDate(d.getDate() - 1);
    }
    return d.toISOString();
  }

  return (
    <div className="px-5 pt-safe pb-4 space-y-5">
      <header className="flex items-center gap-3 pt-4">
        <Link href="/record" aria-label="戻る" className="p-2 -ml-2 rounded-pill hover:bg-accent-soft/40">
          <ArrowLeft size={20} />
        </Link>
        <h1 className="font-mincho text-h2 flex-1">睡眠の記録</h1>
      </header>

      <Card warm className="space-y-2">
        <div className="flex items-start gap-3">
          <div className="rounded-full bg-plum/10 p-2 mt-0.5">
            <Moon size={18} className="text-plum" />
          </div>
          <div className="flex-1">
            <p className="text-body text-ink leading-relaxed">
              眠れた日も、眠れなかった日も。
            </p>
            <p className="mt-1 text-small text-muted leading-relaxed">
              わかる範囲で大丈夫です。気分の波を見るときに、睡眠のリズムが手がかりになります。
            </p>
          </div>
        </div>
      </Card>

      <Card className="space-y-4">
        <div>
          <CardLabel>日付</CardLabel>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="input-paper mt-2"
          />
          <p className="text-kana text-muted mt-1">起きた日を選んでください</p>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <CardLabel>寝た時刻</CardLabel>
            <input
              type="time"
              value={bedtime}
              onChange={(e) => setBedtime(e.target.value)}
              className="input-paper mt-2"
            />
          </div>
          <div>
            <CardLabel>起きた時刻</CardLabel>
            <input
              type="time"
              value={wakeTime}
              onChange={(e) => setWakeTime(e.target.value)}
              className="input-paper mt-2"
            />
          </div>
        </div>
      </Card>

      <Card className="space-y-3">
        <CardLabel>眠りの感じ</CardLabel>
        <div className="grid grid-cols-5 gap-2">
          {QUALITY_OPTIONS.map((opt) => (
            <button
              key={opt.score}
              onClick={() => setQuality(opt.score === quality ? null : opt.score)}
              className={cn(
                'flex flex-col items-center gap-1 rounded-card px-2 py-3 transition-colors',
                quality === opt.score
                  ? 'bg-terracotta/15 border border-terracotta/30'
                  : 'bg-accent-soft/30 border border-transparent hover:bg-accent-soft/50',
              )}
            >
              <span className={cn(
                'font-mincho text-h3',
                quality === opt.score ? 'text-terracotta' : 'text-ink/70',
              )}>
                {opt.score}
              </span>
              <span className="text-kana text-muted leading-tight text-center">
                {opt.label}
              </span>
            </button>
          ))}
        </div>
      </Card>

      <Card>
        <CardLabel>メモ (任意)</CardLabel>
        <Textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="夢を見たとか、夜中に目覚めたとか..."
          rows={3}
          className="mt-2"
        />
      </Card>

      {error ? (
        <p role="alert" className="text-center text-small text-error">
          {error}
        </p>
      ) : null}

      <Button
        onClick={handleSubmit}
        loading={saving}
        disabled={!quality && !bedtime && !wakeTime && !note.trim()}
        className="w-full"
        size="lg"
      >
        記録する
      </Button>

      <p className="text-center text-kana text-muted">
        眠れない夜があっても、それを責められることはありません
      </p>
    </div>
  );
}
