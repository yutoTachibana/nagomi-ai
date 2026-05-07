'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardLabel } from '@/components/ui/Card';
import { Slider } from '@/components/ui/Slider';
import { Textarea } from '@/components/ui/Textarea';
import { TagChips } from '@/components/ui/TagChips';
import { Button } from '@/components/ui/Button';
import { moodLabel, energyLabel } from '@/lib/utils';
import { encrypt } from '@/lib/crypto';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';

const TAG_OPTIONS = [
  '睡眠不足', 'よく眠れた', '生理前', '生理中',
  'イライラ', '涙もろい', '胸の張り', 'むくみ', '頭痛',
  '仕事', '人間関係', '家族', '恋愛',
  '通院日', '薬を飲み忘れた', 'カフェイン多め',
  '外出した', '一日家にいた', '食欲なし', '食欲過多',
  'お酒を飲んだ', '運動した',
];

export function MoodForm() {
  const router = useRouter();
  const [mood, setMood] = React.useState<1 | 2 | 3 | 4 | 5>(3);
  const [energy, setEnergy] = React.useState<1 | 2 | 3 | 4 | 5>(3);
  const [tags, setTags] = React.useState<string[]>([]);
  const [note, setNote] = React.useState('');
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  async function onSubmit() {
    setSaving(true);
    setError(null);
    try {
      const noteEncrypted = note.trim() ? await encrypt(note.trim()) : null;
      const res = await fetch('/api/mood', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          mood_score: mood,
          energy_level: energy,
          tags,
          note_encrypted: noteEncrypted,
        }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.message ?? '保存できませんでした。もう一度試してみてください。');
      }
      router.push('/home');
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : '保存できませんでした。');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="px-5 pt-safe pb-8 space-y-5">
      <header className="flex items-center gap-3 pt-4">
        <Link href="/home" aria-label="戻る" className="p-2 -ml-2 rounded-pill hover:bg-accent-soft/40">
          <ArrowLeft size={20} />
        </Link>
        <h1 className="font-mincho text-h2">気分を記録する</h1>
      </header>

      <Card warm>
        <CardLabel>いま、心の感じは？</CardLabel>
        <p className="mt-2 mb-4 text-small text-muted">
          「良い」「悪い」ではなく、いまの自分の様子を選んでみてください
        </p>
        <Slider
          value={mood}
          onChange={(v) => setMood(v as 1 | 2 | 3 | 4 | 5)}
          labels={['とてもしんどい', 'ふつう', 'のびやか']}
          ariaLabel="気分"
        />
        <p className="mt-3 text-center font-mincho text-h3 text-terracotta">
          {moodLabel(mood)}
        </p>
      </Card>

      <Card>
        <CardLabel>からだのエネルギーは？</CardLabel>
        <p className="mt-2 mb-4 text-small text-muted">
          高ぶり過ぎ・低過ぎは、体調のサインかもしれません
        </p>
        <Slider
          value={energy}
          onChange={(v) => setEnergy(v as 1 | 2 | 3 | 4 | 5)}
          labels={['ほぼゼロ', 'ふつう', 'たかぶり']}
          ariaLabel="エネルギー"
        />
        <p className="mt-3 text-center text-body text-muted">
          {energyLabel(energy)}
        </p>
      </Card>

      <Card>
        <CardLabel>関係しそうなこと</CardLabel>
        <p className="mt-2 mb-4 text-small text-muted">
          当てはまるものがあればタップ。なければスキップで大丈夫です
        </p>
        <TagChips
          options={TAG_OPTIONS}
          selected={tags}
          onChange={setTags}
          allowCustom
        />
      </Card>

      <Card>
        <Textarea
          label="ひとこと(任意)"
          hint="言葉にしなくても良いです。書いた内容は端末で暗号化されます。"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="どんなことでも"
          rows={4}
        />
      </Card>

      {error ? (
        <p role="alert" className="text-center text-small text-error">
          {error}
        </p>
      ) : null}

      <Button onClick={onSubmit} loading={saving} className="w-full" size="lg">
        記録する
      </Button>

      <p className="text-center text-kana text-muted">
        記録は一度に複数残せます。一日のなかで揺れがあっても大丈夫です。
      </p>
    </div>
  );
}
