'use client';

import * as React from 'react';
import Link from 'next/link';
import { ArrowLeft, ChevronRight, Heart } from 'lucide-react';
import { Card, CardLabel, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import {
  ECRS_QUESTIONS,
  ECRS_OPTIONS,
  computeEcrs,
  type EcrsResult,
} from '@/lib/ecrs';
import { cn } from '@/lib/utils';

interface PastResult {
  id: string;
  scaleType: string;
  totalScore: number;
  itemScores: number[];
  completedAt: string;
}

type View = 'home' | 'questions' | 'result';

function formatDate(iso: string): string {
  const d = new Date(iso);
  return `${d.getMonth() + 1}/${d.getDate()}`;
}

export default function AttachmentPage() {
  const [view, setView] = React.useState<View>('home');
  const [answers, setAnswers] = React.useState<number[]>([]);
  const [history, setHistory] = React.useState<PastResult[]>([]);
  const [submitted, setSubmitted] = React.useState<EcrsResult | null>(null);
  const [saving, setSaving] = React.useState(false);

  React.useEffect(() => {
    fetch('/api/self-assessment')
      .then((r) => r.ok ? r.json() : null)
      .then((data) => {
        if (data?.entries) {
          setHistory(data.entries.filter((e: PastResult) => e.scaleType === 'ecrs'));
        }
      })
      .catch(() => {});
  }, []);

  function start() {
    setAnswers([]);
    setView('questions');
  }

  function answer(score: number) {
    const next = [...answers, score];
    setAnswers(next);
    if (next.length >= ECRS_QUESTIONS.length) {
      submit(next);
    }
  }

  async function submit(itemScores: number[]) {
    setSaving(true);
    try {
      const res = await fetch('/api/self-assessment', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          scale_type: 'ecrs',
          item_scores: itemScores,
        }),
      });
      if (!res.ok) throw new Error('save failed');
      const result = computeEcrs(itemScores);
      setSubmitted(result);
      setView('result');

      // refresh history
      const refreshed = await fetch('/api/self-assessment');
      if (refreshed.ok) {
        const hd = await refreshed.json();
        setHistory((hd.entries ?? []).filter((e: PastResult) => e.scaleType === 'ecrs'));
      }
    } catch {
      setView('home');
      setAnswers([]);
    } finally {
      setSaving(false);
    }
  }

  function backHome() {
    setView('home');
    setAnswers([]);
    setSubmitted(null);
  }

  // ---- Questions ----
  if (view === 'questions') {
    const idx = answers.length;
    if (idx >= ECRS_QUESTIONS.length) {
      return (
        <div className="px-5 pt-safe pb-4 flex justify-center pt-12">
          <span className="inline-block h-5 w-5 animate-spin rounded-full border-2 border-terracotta border-t-transparent" />
        </div>
      );
    }
    const q = ECRS_QUESTIONS[idx];

    return (
      <div className="px-5 pt-safe pb-4 space-y-5">
        <header className="flex items-center gap-3 pt-4">
          <button onClick={backHome} aria-label="やめる" className="p-2 -ml-2 rounded-pill hover:bg-accent-soft/40">
            <ArrowLeft size={20} />
          </button>
          <h1 className="font-mincho text-h2 flex-1">愛着スタイル</h1>
          <span className="text-kana text-muted">
            {idx + 1} / {ECRS_QUESTIONS.length}
          </span>
        </header>

        <div className="h-1 rounded-full bg-accent-soft overflow-hidden">
          <div
            className="h-full bg-terracotta/60 transition-all"
            style={{ width: `${((idx) / ECRS_QUESTIONS.length) * 100}%` }}
          />
        </div>

        <Card warm>
          <CardLabel>近しい人 (パートナー / 親しい友人 / 家族) との関係を思い浮かべて</CardLabel>
          <p className="font-mincho text-body leading-relaxed mt-2 text-ink">
            {q.text}
          </p>
        </Card>

        <div className="space-y-2">
          {ECRS_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => answer(opt.value)}
              disabled={saving}
              className={cn(
                'flex w-full items-center justify-between rounded-card border border-accent-soft bg-card px-4 py-3.5',
                'hover:bg-accent-soft/30 transition-colors disabled:opacity-50',
              )}
            >
              <span className="text-body text-ink">{opt.label}</span>
              <ChevronRight size={18} className="text-muted/50" />
            </button>
          ))}
        </div>

        <p className="text-center text-kana text-muted">
          途中でやめても大丈夫です. 完了するまでは保存されません.
        </p>
      </div>
    );
  }

  // ---- Result ----
  if (view === 'result' && submitted) {
    return (
      <div className="px-5 pt-safe pb-4 space-y-5">
        <header className="flex items-center gap-3 pt-4">
          <button onClick={backHome} aria-label="戻る" className="p-2 -ml-2 rounded-pill hover:bg-accent-soft/40">
            <ArrowLeft size={20} />
          </button>
          <h1 className="font-mincho text-h2 flex-1">愛着スタイル の結果</h1>
        </header>

        <Card warm className="space-y-4">
          <CardLabel>あなたの傾向 (推定)</CardLabel>
          <p className="font-mincho text-h2 text-ink">{submitted.styleLabel}</p>

          <Quadrant anxiety={submitted.anxietyScore} avoidance={submitted.avoidanceScore} style={submitted.style} />

          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-card bg-accent-soft/40 px-3 py-2">
              <p className="text-kana text-muted">不安軸</p>
              <p className="font-mincho text-h3 text-ink mt-0.5">
                {submitted.anxietyScore}<span className="text-small text-muted ml-1">/ 7</span>
              </p>
            </div>
            <div className="rounded-card bg-accent-soft/40 px-3 py-2">
              <p className="text-kana text-muted">回避軸</p>
              <p className="font-mincho text-h3 text-ink mt-0.5">
                {submitted.avoidanceScore}<span className="text-small text-muted ml-1">/ 7</span>
              </p>
            </div>
          </div>
        </Card>

        <Card>
          <CardLabel>説明</CardLabel>
          <p className="text-body text-ink leading-relaxed mt-2">{submitted.description}</p>
        </Card>

        <Card>
          <CardLabel>ヒント</CardLabel>
          <p className="text-body text-ink leading-relaxed mt-2">{submitted.hint}</p>
        </Card>

        <Card className="bg-paper/40">
          <p className="text-small text-muted leading-relaxed">
            これは <strong>診断ではありません</strong>. 自己理解のためのリフレクションです.
            人との関係の中での反応傾向は、相手・時期・体調によって変わります.
            深く扱いたいときは、カウンセラーや主治医と一緒に取り組むのが安全です.
          </p>
          <Link href="/library/attachment-styles" className="mt-3 inline-block text-small text-terracotta">
            愛着のスタイルについて読む →
          </Link>
        </Card>

        <Button onClick={backHome} variant="ghost" className="w-full">
          終わる
        </Button>
      </div>
    );
  }

  // ---- Home ----
  const lastResult = history[0];

  return (
    <div className="px-5 pt-safe pb-4 space-y-5">
      <header className="flex items-center gap-3 pt-4">
        <Link href="/record" aria-label="戻る" className="p-2 -ml-2 rounded-pill hover:bg-accent-soft/40">
          <ArrowLeft size={20} />
        </Link>
        <h1 className="font-mincho text-h2">愛着スタイル</h1>
      </header>

      <Card warm>
        <div className="flex items-start gap-3">
          <div className="rounded-full bg-plum/10 p-2 mt-0.5">
            <Heart size={18} className="text-plum" />
          </div>
          <div className="flex-1 space-y-2">
            <CardTitle className="text-body leading-relaxed">
              人との距離感や信頼の持ち方は、人それぞれの傾向があります
            </CardTitle>
            <p className="text-small text-muted leading-relaxed">
              12 問の自己評価で、不安軸・回避軸の傾向を見ます. <strong>診断ではなく、自分を知るためのリフレクション</strong> です.
              ラベルを貼るためではなく、関係の中での自分のパターンに気づくための手がかりに.
            </p>
            <p className="text-small text-muted leading-relaxed">
              所要 3-5 分. パートナー・親しい友人・家族など、近しい人との関係を思い浮かべて答えてください.
            </p>
          </div>
        </div>
      </Card>

      {lastResult ? (
        <Card>
          <CardLabel>前回の結果</CardLabel>
          <p className="text-body text-ink mt-2">
            {formatDate(lastResult.completedAt)} の記録があります.
          </p>
        </Card>
      ) : null}

      <Button onClick={start} className="w-full" size="lg">
        {lastResult ? '今日また確認する' : 'はじめてみる'}
      </Button>

      <Link href="/library/attachment-styles" className="block">
        <Card className="hover:bg-accent-soft/30 transition-colors">
          <p className="text-body text-ink">愛着のスタイルについて読む</p>
          <p className="text-kana text-muted mt-1">4 つの傾向と「安全基地」のこと →</p>
        </Card>
      </Link>

      {history.length > 1 ? (
        <div className="space-y-2">
          <CardLabel className="px-1">これまでの記録</CardLabel>
          <ul className="space-y-2">
            {history.slice(0, 10).map((h) => (
              <li key={h.id}>
                <Card className="py-3 px-4">
                  <p className="text-body text-ink">{formatDate(h.completedAt)} の記録</p>
                </Card>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  4 象限グラフ                                                         */
/* ------------------------------------------------------------------ */

function Quadrant({ anxiety, avoidance, style }: { anxiety: number; avoidance: number; style: string }) {
  // 1-7 を 0-100% に変換
  const x = ((avoidance - 1) / 6) * 100;
  const y = (1 - (anxiety - 1) / 6) * 100;

  return (
    <div className="relative w-full aspect-square rounded-card bg-accent-soft/30 border border-accent-soft p-3">
      {/* 軸 */}
      <div className="absolute left-1/2 top-3 bottom-3 w-px bg-accent-soft -translate-x-1/2" />
      <div className="absolute top-1/2 left-3 right-3 h-px bg-accent-soft -translate-y-1/2" />

      {/* 象限ラベル */}
      <span className="absolute top-2 left-2 text-kana text-muted">不安寄り</span>
      <span className="absolute top-2 right-2 text-kana text-muted">恐れ</span>
      <span className="absolute bottom-2 left-2 text-kana text-muted">安定</span>
      <span className="absolute bottom-2 right-2 text-kana text-muted">回避寄り</span>

      <span className="absolute left-1/2 -bottom-1 -translate-x-1/2 text-kana text-muted">回避軸 →</span>
      <span className="absolute -left-1 top-1/2 -translate-y-1/2 -rotate-90 origin-center text-kana text-muted whitespace-nowrap">不安軸 →</span>

      {/* 自分の点 */}
      <div
        className={cn(
          'absolute w-4 h-4 rounded-full -translate-x-1/2 -translate-y-1/2 border-2 border-card',
          style === 'secure' ? 'bg-sage' :
          style === 'anxious' ? 'bg-terracotta' :
          style === 'avoidant' ? 'bg-plum' :
          'bg-warn',
        )}
        style={{ left: `${x}%`, top: `${y}%` }}
      />
    </div>
  );
}
