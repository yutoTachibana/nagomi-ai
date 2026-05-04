'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { Card, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Wind, Square, Eye, ArrowLeft } from 'lucide-react';

/* ------------------------------------------------------------------ */
/*  Exercise definitions                                               */
/* ------------------------------------------------------------------ */

type ExerciseId = '478' | 'box' | 'grounding';

interface BreathPhase {
  label: string;
  seconds: number;
  /** 1 = fully expanded, 0 = fully contracted, 0.5 = mid */
  targetScale: number;
}

interface BreathExercise {
  id: ExerciseId;
  title: string;
  subtitle: string;
  icon: React.ReactNode;
  phases: BreathPhase[];
}

const exercises: BreathExercise[] = [
  {
    id: '478',
    title: '4-7-8 呼吸法',
    subtitle: '4秒吸って、7秒止めて、8秒吐く',
    icon: <Wind size={22} strokeWidth={1.5} className="text-terracotta" />,
    phases: [
      { label: '吸って...', seconds: 4, targetScale: 1 },
      { label: '止めて...', seconds: 7, targetScale: 1 },
      { label: '吐いて...', seconds: 8, targetScale: 0.5 },
    ],
  },
  {
    id: 'box',
    title: 'ボックス呼吸',
    subtitle: '4秒ずつ、四角く呼吸する',
    icon: <Square size={22} strokeWidth={1.5} className="text-sage" />,
    phases: [
      { label: '吸って...', seconds: 4, targetScale: 1 },
      { label: '止めて...', seconds: 4, targetScale: 1 },
      { label: '吐いて...', seconds: 4, targetScale: 0.5 },
      { label: '止めて...', seconds: 4, targetScale: 0.5 },
    ],
  },
  {
    id: 'grounding',
    title: '5-4-3-2-1 グラウンディング',
    subtitle: '五感に意識を向ける',
    icon: <Eye size={22} strokeWidth={1.5} className="text-plum" />,
    phases: [], // not used for grounding
  },
];

/* ------------------------------------------------------------------ */
/*  Grounding steps                                                    */
/* ------------------------------------------------------------------ */

const groundingSteps = [
  {
    count: 5,
    sense: '目に見えるもの',
    prompt: 'いま周りを見渡して、目に映るものを 5つ、心の中で名前をつけてみてください。',
  },
  {
    count: 4,
    sense: '触れているもの',
    prompt: 'いま身体が触れているものを 4つ、感じてみてください。服の感触、椅子の硬さ、足の裏...',
  },
  {
    count: 3,
    sense: '聞こえるもの',
    prompt: '耳を澄まして、いま聞こえる音を 3つ見つけてみてください。',
  },
  {
    count: 2,
    sense: '匂い',
    prompt: 'いま感じられる匂いを 2つ、探してみてください。何も感じなくても大丈夫です。',
  },
  {
    count: 1,
    sense: '味',
    prompt: '口の中に残っている味を 1つ、感じてみてください。',
  },
];

/* ------------------------------------------------------------------ */
/*  BreathingCircle: animated breathing visualization                  */
/* ------------------------------------------------------------------ */

function BreathingCircle({
  exercise,
  onBack,
}: {
  exercise: BreathExercise;
  onBack: () => void;
}) {
  const [running, setRunning] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [cycles, setCycles] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const cycleLength = exercise.phases.reduce((s, p) => s + p.seconds, 0);

  // Determine current phase & second within that phase
  const timeInCycle = elapsed % cycleLength;
  let acc = 0;
  let currentPhaseIndex = 0;
  let secondInPhase = 0;
  for (let i = 0; i < exercise.phases.length; i++) {
    if (timeInCycle < acc + exercise.phases[i].seconds) {
      currentPhaseIndex = i;
      secondInPhase = timeInCycle - acc;
      break;
    }
    acc += exercise.phases[i].seconds;
  }

  const phase = exercise.phases[currentPhaseIndex];

  // Calculate smooth scale
  const prevScale = currentPhaseIndex === 0
    ? exercise.phases[exercise.phases.length - 1].targetScale
    : exercise.phases[currentPhaseIndex - 1].targetScale;
  const progress = secondInPhase / phase.seconds;
  const scale = running
    ? prevScale + (phase.targetScale - prevScale) * progress
    : 0.5;

  // Map scale (0.5-1) to visual size (0.6-1.0)
  const visualScale = running ? 0.6 + (scale - 0.5) * 0.8 : 0.75;
  const remainingInPhase = phase.seconds - secondInPhase;

  const start = useCallback(() => {
    setRunning(true);
    setElapsed(0);
    setCycles(0);
  }, []);

  const stop = useCallback(() => {
    setRunning(false);
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  useEffect(() => {
    if (!running) return;
    intervalRef.current = setInterval(() => {
      setElapsed((prev) => {
        const next = prev + 1;
        if (next > 0 && next % cycleLength === 0) {
          setCycles((c) => c + 1);
        }
        return next;
      });
    }, 1000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [running, cycleLength]);

  return (
    <div className="space-y-6">
      {/* Back + title */}
      <div className="flex items-center gap-2">
        <button
          onClick={onBack}
          aria-label="戻る"
          className="p-2 -ml-2 rounded-pill hover:bg-accent-soft/40"
        >
          <ArrowLeft size={18} />
        </button>
        <h2 className="font-mincho text-h3">{exercise.title}</h2>
      </div>

      {/* Circle */}
      <div className="flex flex-col items-center gap-6 py-4">
        <div className="relative flex items-center justify-center w-52 h-52">
          <div
            className="absolute inset-0 rounded-full"
            style={{
              background: exercise.id === '478'
                ? 'linear-gradient(135deg, rgba(196,122,90,0.15), rgba(122,140,110,0.15))'
                : 'linear-gradient(135deg, rgba(122,140,110,0.15), rgba(196,122,90,0.15))',
              border: exercise.id === '478'
                ? '2px solid rgba(196,122,90,0.3)'
                : '2px solid rgba(122,140,110,0.3)',
              transform: `scale(${visualScale})`,
              transition: 'transform 1s ease-in-out',
            }}
          />
          <div className="z-10 text-center">
            {running ? (
              <>
                <p className="font-mincho text-h2 text-ink/80">{remainingInPhase}</p>
                <p className="text-body text-muted mt-1">{phase.label}</p>
              </>
            ) : (
              <p className="text-body text-muted">準備ができたら始めましょう</p>
            )}
          </div>
        </div>

        {/* Cycle count - small, not prominent */}
        {running && cycles > 0 && (
          <p className="text-kana text-muted">{cycles} サイクル</p>
        )}

        {/* Controls */}
        <div className="flex gap-3">
          {running ? (
            <Button variant="ghost" onClick={stop}>
              おわる
            </Button>
          ) : (
            <Button variant="primary" onClick={start}>
              はじめる
            </Button>
          )}
        </div>
      </div>

      {/* Tip */}
      <p className="text-small text-muted text-center leading-relaxed">
        {exercise.id === '478'
          ? '眠れない夜にもおすすめです。無理のない範囲で続けてみてください。'
          : '焦らなくて大丈夫。自分のペースで呼吸してください。'}
      </p>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  GroundingGuide: step-through text guide                            */
/* ------------------------------------------------------------------ */

function GroundingGuide({ onBack }: { onBack: () => void }) {
  const [step, setStep] = useState(0);
  const [finished, setFinished] = useState(false);

  const current = groundingSteps[step];

  const next = () => {
    if (step < groundingSteps.length - 1) {
      setStep((s) => s + 1);
    } else {
      setFinished(true);
    }
  };

  const restart = () => {
    setStep(0);
    setFinished(false);
  };

  return (
    <div className="space-y-6">
      {/* Back + title */}
      <div className="flex items-center gap-2">
        <button
          onClick={onBack}
          aria-label="戻る"
          className="p-2 -ml-2 rounded-pill hover:bg-accent-soft/40"
        >
          <ArrowLeft size={18} />
        </button>
        <h2 className="font-mincho text-h3">5-4-3-2-1 グラウンディング</h2>
      </div>

      <Card warm className="py-6 px-5">
        {finished ? (
          <div className="text-center space-y-4">
            <p className="font-mincho text-h3 text-ink/80">お疲れさまでした</p>
            <p className="text-body text-muted leading-relaxed">
              五感に意識を向けることで、<br />
              「いま、ここ」に戻ってくることができます。<br />
              必要なときはいつでもやってみてください。
            </p>
            <div className="flex gap-3 justify-center pt-2">
              <Button variant="ghost" size="sm" onClick={restart}>
                もう一度やる
              </Button>
              <Button variant="ghost" size="sm" onClick={onBack}>
                戻る
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-5">
            {/* Progress indicator - gentle dots */}
            <div className="flex gap-2 justify-center">
              {groundingSteps.map((_, i) => (
                <div
                  key={i}
                  className="w-2 h-2 rounded-full transition-colors duration-300"
                  style={{
                    backgroundColor:
                      i <= step
                        ? 'rgba(138,74,92,0.5)'
                        : 'rgba(138,74,92,0.15)',
                  }}
                />
              ))}
            </div>

            <div className="text-center space-y-3">
              <p className="text-kana uppercase tracking-widest text-muted">
                {current.count}つ: {current.sense}
              </p>
              <p className="font-mincho text-lead text-ink/80 leading-relaxed">
                {current.prompt}
              </p>
            </div>

            <p className="text-small text-muted text-center">
              ゆっくりで大丈夫です。準備ができたら次に進んでください。
            </p>

            <div className="flex justify-center">
              <Button variant="ghost" onClick={next}>
                {step < groundingSteps.length - 1 ? '次へ' : '完了する'}
              </Button>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Main: exercise selector                                            */
/* ------------------------------------------------------------------ */

export function BreathingExercise() {
  const [selected, setSelected] = useState<ExerciseId | null>(null);

  if (selected === 'grounding') {
    return <GroundingGuide onBack={() => setSelected(null)} />;
  }

  if (selected) {
    const exercise = exercises.find((e) => e.id === selected)!;
    return <BreathingCircle exercise={exercise} onBack={() => setSelected(null)} />;
  }

  return (
    <div className="space-y-3">
      {exercises.map((ex) => (
        <button
          key={ex.id}
          onClick={() => setSelected(ex.id)}
          className="card w-full text-left hover:shadow-lift transition-shadow active:translate-y-[1px] flex items-center gap-4"
        >
          <div className="shrink-0">{ex.icon}</div>
          <div>
            <CardTitle className="text-body font-medium">{ex.title}</CardTitle>
            <p className="mt-1 text-small text-muted">{ex.subtitle}</p>
          </div>
        </button>
      ))}
    </div>
  );
}
