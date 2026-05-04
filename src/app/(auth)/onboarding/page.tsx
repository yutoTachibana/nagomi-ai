'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Card, CardLabel, CardTitle } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { TagChips } from '@/components/ui/TagChips';
import { ChevronRight, ChevronLeft, Check, Shield, Heart } from 'lucide-react';

const DIAGNOSIS_LABELS: Record<string, string> = {
  anxiety: '不安障害',
  adjustment: '適応障害',
  bipolar2: '双極 II 型',
  bipolar1: '双極 I 型',
  depression: 'うつ病',
  panic: 'パニック障害',
  social_anxiety: '社交不安障害',
  prefer_not_to_say: 'わからない / 言いたくない',
  other: 'その他',
};

/** Simple leaf/plant SVG motif for the welcome step */
function LeafMotif() {
  return (
    <svg
      width="64"
      height="64"
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="mx-auto text-sage/40"
      aria-hidden="true"
    >
      <path
        d="M32 8C32 8 20 20 20 36C20 44 24 50 32 56C40 50 44 44 44 36C44 20 32 8 32 8Z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M32 20V48"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <path
        d="M32 30C28 28 24 30 24 30"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <path
        d="M32 38C36 36 40 38 40 38"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

/**
 * 3 ステップのオンボーディング.
 * 1. 名前 (任意. 呼びかけ用)
 * 2. 自己申告の状態 (任意. 「医療診断ではなく、自分の言葉で」)
 * 3. 約束ごと: ことねは AI、医療代替ではない、合わないときは離れて良い
 */
export default function OnboardingPage() {
  const router = useRouter();
  const { data: session } = useSession();

  const [step, setStep] = React.useState(0);
  const [displayName, setDisplayName] = React.useState('');
  const [diagnosis, setDiagnosis] = React.useState<string[]>([]);
  const [busy, setBusy] = React.useState(false);

  // Key to re-trigger fade-in animation on step change
  const [animKey, setAnimKey] = React.useState(0);

  function goToStep(next: number) {
    setAnimKey((k) => k + 1);
    setStep(next);
  }

  async function complete() {
    setBusy(true);
    if (!session?.user?.id) {
      router.push('/login');
      return;
    }
    // Filter out "prefer_not_to_say" from saved diagnosis
    const savedDiagnosis = diagnosis.filter((d) => d !== 'prefer_not_to_say');
    await fetch('/api/profile', {
      method: 'PATCH',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        display_name: displayName.trim() || null,
        diagnosis_self_report: savedDiagnosis,
        onboarding_completed: true,
        terms_accepted_version: '0.1.0',
        terms_accepted_at: new Date().toISOString(),
      }),
    });
    router.push('/home');
    router.refresh();
  }

  return (
    <div className="flex flex-1 flex-col space-y-6 pt-8">
      {/* プログレス */}
      <div className="flex gap-1.5">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className={`h-1 flex-1 rounded-full transition-colors duration-300 ${i <= step ? 'bg-terracotta' : 'bg-accent-soft'}`}
          />
        ))}
      </div>

      {step === 0 && (
        <div key={`step0-${animKey}`} className="animate-fade-in">
          <Card warm className="space-y-5">
            <LeafMotif />
            <p className="text-center font-mincho text-h3 text-ink leading-relaxed">
              こもれびへようこそ。
              <br />
              ここは、あなたのペースで過ごせる場所です。
            </p>

            <div className="border-t border-accent-soft/50" />

            <CardLabel>STEP 1 / 3</CardLabel>
            <CardTitle>なんて呼びましょうか</CardTitle>
            <p className="text-small text-muted leading-relaxed">
              呼びかけに使う名前です。本名でなくて大丈夫。
            </p>
            <Input
              placeholder="ニックネーム"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
            />
            <p className="text-kana text-muted text-center">
              あとでいつでも変更できます
            </p>
            <div className="flex flex-col gap-2">
              <Button onClick={() => goToStep(1)} className="w-full">
                次へ <ChevronRight size={18} />
              </Button>
              <button
                type="button"
                onClick={() => {
                  setDisplayName('');
                  goToStep(1);
                }}
                className="py-2 text-body text-muted hover:text-ink transition-colors text-center"
              >
                スキップ
              </button>
            </div>
          </Card>
        </div>
      )}

      {step === 1 && (
        <div key={`step1-${animKey}`} className="animate-fade-in">
          <Card warm className="space-y-4">
            <CardLabel>STEP 2 / 3</CardLabel>
            <CardTitle>いまの自分について</CardTitle>
            <p className="text-small text-muted leading-relaxed">
              これは医療診断ではありません。自分の言葉で、いまの自分について教えてください。
              <br />
              選ばなくても大丈夫です。
            </p>
            <TagChips
              options={Object.values(DIAGNOSIS_LABELS)}
              selected={diagnosis.map((k) => DIAGNOSIS_LABELS[k] ?? k)}
              onChange={(labels) => {
                const keys = labels
                  .map((l) => Object.entries(DIAGNOSIS_LABELS).find(([, v]) => v === l)?.[0])
                  .filter(Boolean) as string[];
                setDiagnosis(keys);
              }}
            />
            <p className="text-kana text-muted text-center">
              あとでいつでも変更できます
            </p>
            <div className="flex flex-col gap-2">
              <div className="flex gap-2">
                <Button variant="ghost" onClick={() => goToStep(0)} className="min-w-[48px]">
                  <ChevronLeft size={18} />
                </Button>
                <Button onClick={() => goToStep(2)} className="flex-1">
                  次へ <ChevronRight size={18} />
                </Button>
              </div>
              <button
                type="button"
                onClick={() => {
                  setDiagnosis([]);
                  goToStep(2);
                }}
                className="py-2 text-small text-muted hover:text-ink transition-colors text-center"
              >
                スキップ
              </button>
            </div>
          </Card>
        </div>
      )}

      {step === 2 && (
        <div key={`step2-${animKey}`} className="animate-fade-in">
          <Card warm className="space-y-4">
            <CardLabel>STEP 3 / 3</CardLabel>
            <CardTitle>こもれびとの約束</CardTitle>
            <ul className="space-y-4 text-body leading-relaxed">
              <PromiseItem icon="check">
                ことね (AI) は医師の代わりにはなれません。気になることは主治医に。
              </PromiseItem>
              <div className="border-t border-accent-soft/40" />
              <PromiseItem icon="check">
                続けられない時期があっても大丈夫。あなたを責めません。
              </PromiseItem>
              <div className="border-t border-accent-soft/40" />
              <PromiseItem icon="check">
                書いたものはあなたのもの。いつでも消せます。
              </PromiseItem>
              <div className="border-t border-accent-soft/40" />
              <PromiseItem icon="heart">
                合わないと感じたら、離れていいです。それも自分を大切にすることです。
              </PromiseItem>
            </ul>

            <div className="border-t border-accent-soft/50" />

            <div className="space-y-2">
              <div className="flex items-start gap-2 text-small text-muted">
                <Shield size={16} className="mt-0.5 flex-shrink-0 text-sage" />
                <span>あなたの記録は端末で暗号化されます (現在はテスト版のため暗号化はオフです)</span>
              </div>
              <div className="flex items-start gap-2 text-small text-muted">
                <Shield size={16} className="mt-0.5 flex-shrink-0 text-sage" />
                <span>こもれびは、あなたのデータを広告や分析に使いません</span>
              </div>
            </div>

            <div className="flex gap-2">
              <Button variant="ghost" onClick={() => goToStep(1)} className="min-w-[48px]">
                <ChevronLeft size={18} />
              </Button>
              <Button onClick={complete} loading={busy} className="flex-1" size="lg">
                はじめる
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}

function PromiseItem({ children, icon }: { children: React.ReactNode; icon: 'check' | 'heart' }) {
  return (
    <li className="flex items-start gap-2">
      {icon === 'heart' ? (
        <Heart size={18} className="mt-1 flex-shrink-0 text-plum" />
      ) : (
        <Check size={18} className="mt-1 flex-shrink-0 text-sage" />
      )}
      <span>{children}</span>
    </li>
  );
}
