'use client';

import * as React from 'react';
import Link from 'next/link';
import { ArrowLeft, ChevronRight, ClipboardCheck, ShieldCheck } from 'lucide-react';
import { Card, CardLabel, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { ALL_SCALES, getScale, interpretScore, isPhq9CrisisSignal, type ScaleType, type AssessmentScale } from '@/lib/self-assessment';
import { cn } from '@/lib/utils';

interface PastAssessment {
  id: string;
  scaleType: ScaleType;
  totalScore: number;
  completedAt: string;
}

type View = 'home' | 'questions' | 'result';

export default function CheckupPage() {
  const [view, setView] = React.useState<View>('home');
  const [scale, setScale] = React.useState<AssessmentScale | null>(null);
  const [answers, setAnswers] = React.useState<number[]>([]);
  const [history, setHistory] = React.useState<PastAssessment[]>([]);
  const [submittedScore, setSubmittedScore] = React.useState<{ scale: AssessmentScale; score: number; itemScores: number[] } | null>(null);
  const [saving, setSaving] = React.useState(false);

  React.useEffect(() => {
    fetch('/api/self-assessment')
      .then((r) => r.ok ? r.json() : null)
      .then((data) => {
        if (data?.entries) setHistory(data.entries);
      })
      .catch(() => {});
  }, []);

  function startScale(s: AssessmentScale) {
    setScale(s);
    setAnswers([]);
    setView('questions');
  }

  function answer(score: number) {
    if (!scale) return;
    const next = [...answers, score];
    setAnswers(next);
    if (next.length >= scale.questions.length) {
      submitAnswers(next);
    }
  }

  async function submitAnswers(itemScores: number[]) {
    if (!scale) return;
    setSaving(true);
    try {
      const res = await fetch('/api/self-assessment', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          scale_type: scale.type,
          item_scores: itemScores,
        }),
      });
      if (!res.ok) throw new Error('save failed');
      const data = await res.json();
      const total = data.entry?.totalScore ?? itemScores.reduce((a, b) => a + b, 0);
      setSubmittedScore({ scale, score: total, itemScores });
      setView('result');

      // Reload history
      const refreshed = await fetch('/api/self-assessment');
      if (refreshed.ok) {
        const hd = await refreshed.json();
        setHistory(hd.entries ?? []);
      }
    } catch {
      // Silent — back to home
      setView('home');
      setAnswers([]);
    } finally {
      setSaving(false);
    }
  }

  function backToHome() {
    setView('home');
    setScale(null);
    setAnswers([]);
    setSubmittedScore(null);
  }

  // ---- Questions view ----
  if (view === 'questions' && scale) {
    const idx = answers.length;
    if (idx >= scale.questions.length) {
      // Saving in progress
      return (
        <div className="px-5 pt-safe pb-4 flex justify-center pt-12">
          <span className="inline-block h-5 w-5 animate-spin rounded-full border-2 border-terracotta border-t-transparent" />
        </div>
      );
    }
    const question = scale.questions[idx];
    return (
      <div className="px-5 pt-safe pb-4 space-y-5">
        <header className="flex items-center gap-3 pt-4">
          <button onClick={backToHome} aria-label="やめる" className="p-2 -ml-2 rounded-pill hover:bg-accent-soft/40">
            <ArrowLeft size={20} />
          </button>
          <h1 className="font-mincho text-h2 flex-1">{scale.shortName}</h1>
          <span className="text-kana text-muted">
            {idx + 1} / {scale.questions.length}
          </span>
        </header>

        <div className="h-1 rounded-full bg-accent-soft overflow-hidden">
          <div
            className="h-full bg-terracotta/60 transition-all"
            style={{ width: `${((idx) / scale.questions.length) * 100}%` }}
          />
        </div>

        <Card warm>
          <CardLabel>{scale.timeFrame}を振り返って</CardLabel>
          <p className="font-mincho text-body leading-relaxed mt-2 text-ink">
            {question}
          </p>
        </Card>

        <div className="space-y-2">
          {scale.optionLabels.map((label, score) => (
            <button
              key={score}
              onClick={() => answer(score)}
              disabled={saving}
              className={cn(
                'flex w-full items-center justify-between rounded-card border border-accent-soft bg-card px-4 py-3.5',
                'hover:bg-accent-soft/30 transition-colors disabled:opacity-50',
              )}
            >
              <span className="text-body text-ink">{label}</span>
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

  // ---- Result view ----
  if (view === 'result' && submittedScore) {
    const { scale, score, itemScores } = submittedScore;
    const interp = interpretScore(scale, score);
    const crisis = isPhq9CrisisSignal(scale.type, itemScores);
    const max = scale.questions.length * 3;

    return (
      <div className="px-5 pt-safe pb-4 space-y-5">
        <header className="flex items-center gap-3 pt-4">
          <button onClick={backToHome} aria-label="戻る" className="p-2 -ml-2 rounded-pill hover:bg-accent-soft/40">
            <ArrowLeft size={20} />
          </button>
          <h1 className="font-mincho text-h2 flex-1">{scale.shortName} の結果</h1>
        </header>

        <Card warm className="text-center py-6 space-y-2">
          <CardLabel>合計スコア</CardLabel>
          <div className="flex items-baseline justify-center gap-2">
            <span className="font-mincho text-display text-terracotta">{score}</span>
            <span className="text-body text-muted">/ {max}</span>
          </div>
          <p className="font-mincho text-h3 text-ink mt-2">{interp.label}</p>
        </Card>

        <Card>
          <CardLabel>ひとこと</CardLabel>
          <p className="text-body text-ink leading-relaxed mt-2">{interp.advice}</p>
          <p className="text-kana text-muted leading-relaxed mt-3">
            これは診断ではなく、自己モニタリングのためのスケールです.
            次の診察で主治医に経過を見てもらう手がかりに使えます.
          </p>
        </Card>

        {crisis ? (
          <Card className="border-plum/40 bg-plum/5 space-y-3">
            <div className="flex items-start gap-3">
              <ShieldCheck size={20} className="text-plum mt-0.5 shrink-0" />
              <div>
                <p className="font-medium text-body text-ink">
                  気になる回答がありました
                </p>
                <p className="text-small text-muted leading-relaxed mt-1">
                  「自分を傷つけたい」と感じる気持ちが見えています.
                  一人で抱え込まず、よかったらサポートに繋がってみてください.
                </p>
              </div>
            </div>
            <div className="flex flex-col gap-2">
              <Link href="/crisis" className="btn-primary">
                サポートを見る
              </Link>
              <Link href="/crisis/plan" className="text-center text-small text-plum">
                セーフティプランを見る →
              </Link>
            </div>
          </Card>
        ) : null}

        <Button onClick={backToHome} variant="ghost" className="w-full">
          終わる
        </Button>
      </div>
    );
  }

  // ---- Home view ----
  const recentByScale = new Map<ScaleType, PastAssessment>();
  for (const h of history) {
    if (!recentByScale.has(h.scaleType)) {
      recentByScale.set(h.scaleType, h);
    }
  }

  return (
    <div className="px-5 pt-safe pb-4 space-y-5">
      <header className="flex items-center gap-3 pt-4">
        <Link href="/record" aria-label="戻る" className="p-2 -ml-2 rounded-pill hover:bg-accent-soft/40">
          <ArrowLeft size={20} />
        </Link>
        <h1 className="font-mincho text-h2">セルフチェック</h1>
      </header>

      <Card warm>
        <div className="flex items-start gap-3">
          <div className="rounded-full bg-sage/10 p-2 mt-0.5">
            <ClipboardCheck size={18} className="text-sage" />
          </div>
          <div className="flex-1">
            <p className="text-body text-ink leading-relaxed">
              世界中で使われている、こころの状態の自己チェックです.
            </p>
            <p className="text-small text-muted leading-relaxed mt-2">
              <strong className="font-medium">診断ではありません.</strong> 自分の経過を主治医や相談窓口と共有するときに使います.
              月に 1 回ぐらいが目安です.
            </p>
          </div>
        </div>
      </Card>

      {ALL_SCALES.map((s) => {
        const recent = recentByScale.get(s.type);
        return (
          <Card key={s.type} className="space-y-3">
            <div>
              <CardTitle>{s.shortName}</CardTitle>
              <p className="text-kana text-muted mt-1">{s.timeFrame}・{s.questions.length} 問</p>
              <p className="text-small text-muted mt-2 leading-relaxed">{s.description}</p>
            </div>
            {recent ? (
              <div className="bg-accent-soft/40 rounded-card px-3 py-2 text-small text-ink">
                前回: {recent.totalScore} 点 ({formatDate(recent.completedAt)})
              </div>
            ) : null}
            <Button onClick={() => startScale(s)} className="w-full">
              {recent ? '今日また確認する' : 'はじめてみる'}
            </Button>
          </Card>
        );
      })}

      {history.length > 0 ? (
        <div className="space-y-2">
          <CardLabel className="px-1">これまでの記録</CardLabel>
          <ul className="space-y-2">
            {history.slice(0, 10).map((h) => {
              const s = getScale(h.scaleType);
              return (
                <li key={h.id}>
                  <Card className="py-3 px-4">
                    <div className="flex items-baseline justify-between gap-2">
                      <p className="text-body text-ink">{s.shortName}</p>
                      <span className="text-kana text-muted">{formatDate(h.completedAt)}</span>
                    </div>
                    <p className="text-small text-muted mt-1">
                      {h.totalScore} 点 / {s.questions.length * 3}
                    </p>
                  </Card>
                </li>
              );
            })}
          </ul>
        </div>
      ) : null}
    </div>
  );
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  return `${d.getMonth() + 1}/${d.getDate()}`;
}
