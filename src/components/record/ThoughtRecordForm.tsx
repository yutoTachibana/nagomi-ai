'use client';

import * as React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, ChevronRight, ChevronLeft, Check } from 'lucide-react';
import { Card, CardLabel, CardTitle } from '@/components/ui/Card';
import { Textarea } from '@/components/ui/Textarea';
import { Button } from '@/components/ui/Button';
import { EmotionInput } from '@/components/record/EmotionInput';
import { COGNITIVE_DISTORTIONS } from '@/lib/cbt/distortions';
import { encrypt } from '@/lib/crypto';
import type { EmotionEntry, CognitiveDistortion } from '@/types/db';
import { cn } from '@/lib/utils';

/**
 * CBT 7 コラム法 (簡略 6 コラム版)
 * 1. 状況: いつ、どこで、誰と、何があった?
 * 2. 感情: いまの感情と強さ
 * 3. 自動思考: そのとき頭をよぎった考え
 * 4. 根拠: その考えを支持する事実
 * 5. 反対の証拠: その考えと矛盾する事実
 * 6. バランス思考: 上を踏まえた、もう少し柔らかい考え方
 *  + 認知の歪みチェック (任意)
 *  + 結果の感情強度を再評価
 *
 * 設計: 1 ステップ 1 質問. 「全部を埋めなくていい」を強調する
 */

const STEPS = [
  { key: 'situation', title: 'どんな状況だった？', hint: 'いつ・どこで・誰と・何があった？ 思い出せる範囲で良いです' },
  { key: 'emotions_before', title: 'いま、どんな気持ち？', hint: '当てはまるものを選んで、強さを 0-100 で' },
  { key: 'automatic_thought', title: 'そのとき、頭に浮かんだのは？', hint: '言葉にすると、よく出てくる考え。思いつくまま書いて大丈夫です' },
  { key: 'distortions', title: '思考のクセは？', hint: 'もし当てはまるものがあればチェック。なくても OK' },
  { key: 'evidence_for', title: 'その考えを支持する事実は？', hint: '「実際にこうだった」と言える事実だけ。感じたことは含めない' },
  { key: 'evidence_against', title: '反対側の事実は？', hint: '見過ごしていた事実、別の見方ができる事実' },
  { key: 'balanced_thought', title: 'もう少しバランスのとれた考え方は？', hint: '「こうあるべき」ではなく「こうも言えるかもしれない」' },
  { key: 'emotions_after', title: 'いま、感情の強さはどう？', hint: 'さっきと比べて、少しでも変化があれば書き換えてみてください' },
  { key: 'review', title: 'おつかれさまでした', hint: '' },
] as const;

export function ThoughtRecordForm() {
  const router = useRouter();
  const [step, setStep] = React.useState(0);
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const [situation, setSituation] = React.useState('');
  const [emotionsBefore, setEmotionsBefore] = React.useState<EmotionEntry[]>([]);
  const [automaticThought, setAutomaticThought] = React.useState('');
  const [distortions, setDistortions] = React.useState<CognitiveDistortion[]>([]);
  const [evidenceFor, setEvidenceFor] = React.useState('');
  const [evidenceAgainst, setEvidenceAgainst] = React.useState('');
  const [balancedThought, setBalancedThought] = React.useState('');
  const [emotionsAfter, setEmotionsAfter] = React.useState<EmotionEntry[]>([]);

  // 「結果の感情」初期化: 最初の感情をコピー
  React.useEffect(() => {
    if (STEPS[step].key === 'emotions_after' && emotionsAfter.length === 0 && emotionsBefore.length > 0) {
      setEmotionsAfter(emotionsBefore.map((e) => ({ ...e })));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step]);

  async function save() {
    setSaving(true);
    setError(null);
    try {
      const payload = {
        situation_encrypted: situation.trim() ? await encrypt(situation.trim()) : null,
        emotions_before: emotionsBefore.length ? emotionsBefore : null,
        automatic_thought_encrypted: automaticThought.trim() ? await encrypt(automaticThought.trim()) : null,
        evidence_for_encrypted: evidenceFor.trim() ? await encrypt(evidenceFor.trim()) : null,
        evidence_against_encrypted: evidenceAgainst.trim() ? await encrypt(evidenceAgainst.trim()) : null,
        balanced_thought_encrypted: balancedThought.trim() ? await encrypt(balancedThought.trim()) : null,
        emotions_after: emotionsAfter.length ? emotionsAfter : null,
        cognitive_distortions: distortions,
      };
      const res = await fetch('/api/thought-record', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.message ?? '保存できませんでした');
      }
      router.push('/home');
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : '保存できませんでした');
    } finally {
      setSaving(false);
    }
  }

  const current = STEPS[step];
  const isLast = step === STEPS.length - 1;
  return (
    <div className="px-5 pt-safe pb-8 space-y-5">
      <header className="flex items-center justify-between pt-4">
        <Link href="/record" aria-label="戻る" className="p-2 -ml-2 rounded-pill hover:bg-accent-soft/40">
          <ArrowLeft size={20} />
        </Link>
        <span className="text-kana text-muted">
          {step + 1} / {STEPS.length}
        </span>
      </header>

      {/* プログレスバー */}
      <div className="flex gap-1.5">
        {STEPS.map((s, i) => (
          <div
            key={s.key}
            className={cn(
              'h-1 flex-1 rounded-full transition-colors',
              i <= step ? 'bg-terracotta' : 'bg-accent-soft',
            )}
          />
        ))}
      </div>

      <Card warm>
        <CardLabel>STEP {step + 1}</CardLabel>
        <CardTitle className="mt-1.5 leading-snug">{current.title}</CardTitle>
        {current.hint ? (
          <p className="mt-2 text-small text-muted">{current.hint}</p>
        ) : null}

        <div className="mt-5">
          {current.key === 'situation' && (
            <Textarea
              value={situation}
              onChange={(e) => setSituation(e.target.value)}
              rows={6}
              placeholder="例: 昨日の夜、職場のグループチャットで自分の発言が既読スルーされた"
            />
          )}
          {current.key === 'emotions_before' && (
            <EmotionInput value={emotionsBefore} onChange={setEmotionsBefore} />
          )}
          {current.key === 'automatic_thought' && (
            <Textarea
              value={automaticThought}
              onChange={(e) => setAutomaticThought(e.target.value)}
              rows={5}
              placeholder="例: みんなに嫌われたんだ。私の発言は的外れだったに違いない"
            />
          )}
          {current.key === 'distortions' && (
            <DistortionPicker selected={distortions} onChange={setDistortions} />
          )}
          {current.key === 'evidence_for' && (
            <Textarea
              value={evidenceFor}
              onChange={(e) => setEvidenceFor(e.target.value)}
              rows={5}
              placeholder="例: 実際に既読がついて返信がなかった"
            />
          )}
          {current.key === 'evidence_against' && (
            <Textarea
              value={evidenceAgainst}
              onChange={(e) => setEvidenceAgainst(e.target.value)}
              rows={5}
              placeholder="例: みんな仕事中で忙しかった可能性がある。普段は普通に話してくれる"
            />
          )}
          {current.key === 'balanced_thought' && (
            <Textarea
              value={balancedThought}
              onChange={(e) => setBalancedThought(e.target.value)}
              rows={5}
              placeholder="例: 既読スルーはしんどい。でも忙しかっただけかもしれず、自分の存在価値の話とは別かもしれない"
            />
          )}
          {current.key === 'emotions_after' && (
            <EmotionInput value={emotionsAfter} onChange={setEmotionsAfter} />
          )}
          {current.key === 'review' && (
            <ReviewBlock
              before={emotionsBefore}
              after={emotionsAfter}
              hadDistortions={distortions.length > 0}
            />
          )}
        </div>
      </Card>

      {error ? (
        <p role="alert" className="text-center text-small text-error">
          {error}
        </p>
      ) : null}

      <div className="flex gap-3">
        {step > 0 ? (
          <Button
            variant="ghost"
            onClick={() => setStep(step - 1)}
            className="flex-1"
          >
            <ChevronLeft size={18} /> 戻る
          </Button>
        ) : null}
        {!isLast ? (
          <Button
            onClick={() => setStep(step + 1)}
            className="flex-1"
          >
            次へ <ChevronRight size={18} />
          </Button>
        ) : (
          <Button
            onClick={save}
            loading={saving}
            className="flex-1"
            size="lg"
          >
            <Check size={18} /> 保存する
          </Button>
        )}
      </div>

      <p className="text-center text-kana text-muted">
        途中までで終えても、また続きから書けます。
      </p>
    </div>
  );
}

function DistortionPicker({
  selected,
  onChange,
}: {
  selected: CognitiveDistortion[];
  onChange: (next: CognitiveDistortion[]) => void;
}) {
  const [openKey, setOpenKey] = React.useState<CognitiveDistortion | null>(null);
  function toggle(key: CognitiveDistortion) {
    if (selected.includes(key)) onChange(selected.filter((k) => k !== key));
    else onChange([...selected, key]);
  }
  return (
    <ul className="space-y-2">
      {COGNITIVE_DISTORTIONS.map((d) => {
        const checked = selected.includes(d.key);
        const open = openKey === d.key;
        return (
          <li key={d.key} className={cn(
            'rounded-card border transition-colors',
            checked ? 'border-terracotta bg-terracotta/5' : 'border-accent-soft bg-card',
          )}>
            <button
              type="button"
              onClick={() => toggle(d.key)}
              className="flex w-full items-center gap-3 px-4 py-3 text-left"
            >
              <span
                aria-hidden
                className={cn(
                  'flex h-5 w-5 items-center justify-center rounded border',
                  checked
                    ? 'border-terracotta bg-terracotta text-white'
                    : 'border-muted/40',
                )}
              >
                {checked ? <Check size={14} /> : null}
              </span>
              <span className="flex-1 text-body">{d.name}</span>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setOpenKey(open ? null : d.key);
                }}
                className="text-kana text-muted underline"
              >
                {open ? '閉じる' : 'くわしく'}
              </button>
            </button>
            {open ? (
              <div className="border-t border-accent-soft px-4 py-3 text-small text-muted">
                <p>{d.description}</p>
                <p className="mt-1.5 italic">{d.example}</p>
              </div>
            ) : null}
          </li>
        );
      })}
    </ul>
  );
}

function ReviewBlock({
  before,
  after,
  hadDistortions,
}: {
  before: EmotionEntry[];
  after: EmotionEntry[];
  hadDistortions: boolean;
}) {
  // 平均の差を計算
  const avgBefore =
    before.length > 0 ? before.reduce((a, b) => a + b.intensity, 0) / before.length : 0;
  const avgAfter =
    after.length > 0 ? after.reduce((a, b) => a + b.intensity, 0) / after.length : 0;
  const diff = avgAfter - avgBefore;
  const sameOrIncreased = diff >= 0;

  return (
    <div className="space-y-4 text-body">
      <p className="font-mincho leading-loose text-ink/85">
        書き出してみるだけで、頭の整理にエネルギーを使ったはずです。
      </p>
      {avgBefore > 0 && avgAfter > 0 ? (
        sameOrIncreased ? (
          <p className="text-small text-muted leading-relaxed">
            感情の強さは大きく変わらなかったかもしれません。それは「効かなかった」ではなく、
            <strong className="text-ink">いまはまだ感じる時間が必要</strong>
            ということもあります。書き留めたこと自体に価値があります。
          </p>
        ) : (
          <p className="text-small text-muted leading-relaxed">
            少し、強さがやわらいだようです (平均で {Math.round(-diff)} ほど)。
            これは「考えを整理した」効果かもしれません。明日また同じ気持ちが戻ってきても、それは普通のことです。
          </p>
        )
      ) : null}
      {hadDistortions ? (
        <p className="text-small text-muted leading-relaxed">
          チェックした「思考のクセ」は、誰にでもあるものです。気づけたこと自体が、もうひとつの新しい視点です。
        </p>
      ) : null}
      <div className="rounded-card bg-paper/60 p-4">
        <p className="font-mincho text-body leading-loose text-ink/80">
          書いた内容は、いつでも「みつめる」から見返せます。<br />
          でも、見返さなくても大丈夫です。
        </p>
      </div>
    </div>
  );
}
