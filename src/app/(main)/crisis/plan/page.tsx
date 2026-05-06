'use client';

import * as React from 'react';
import Link from 'next/link';
import { ArrowLeft, ShieldCheck } from 'lucide-react';
import { Card, CardLabel, CardTitle } from '@/components/ui/Card';
import { Textarea } from '@/components/ui/Textarea';
import { Button } from '@/components/ui/Button';
import { encrypt, decrypt } from '@/lib/crypto';

interface PlanFields {
  warningSigns: string;
  internalCoping: string;
  socialDistractions: string;
  trustedPeople: string;
  professionals: string;
  environment: string;
}

const STEPS: { key: keyof PlanFields; title: string; hint: string; placeholder: string }[] = [
  {
    key: 'warningSigns',
    title: '1. 警戒サイン',
    hint: 'こころが下に向かっているとき、自分でわかる兆候を書きます。考え・気持ち・身体感覚・行動など。',
    placeholder: '例: 食欲が落ちる、眠れない、泣きたくなる、人と会いたくなくなる、SNS を見続ける',
  },
  {
    key: 'internalCoping',
    title: '2. 自分でできる対処',
    hint: '誰かに頼らず、ひとりでできる気を逸らす方法。完璧でなくて大丈夫です。',
    placeholder: '例: 4-7-8 呼吸、お風呂に入る、好きな音楽、近所を 5 分歩く、温かい飲み物を飲む',
  },
  {
    key: 'socialDistractions',
    title: '3. 気を逸らせる人や場所',
    hint: '深刻な話をしなくていい、ただ一緒にいられる人や、行ける場所。',
    placeholder: '例: 友人〇〇とカフェで会う、コンビニ、24時間営業のファミレス、図書館',
  },
  {
    key: 'trustedPeople',
    title: '4. 助けを求められる人',
    hint: 'しんどい話をしてもいい人。連絡先 (LINE / 電話番号など) も書いておくと迷わない。',
    placeholder: '例: 母 090-xxxx-xxxx、よるちゃん LINE、〇〇さん',
  },
  {
    key: 'professionals',
    title: '5. 専門家・相談窓口',
    hint: '主治医、カウンセラー、相談ダイヤルなど。',
    placeholder: '例: 主治医 03-xxxx-xxxx、よりそいホットライン 0120-279-338、#いのちSOS LINE',
  },
  {
    key: 'environment',
    title: '6. 安全な環境を作る',
    hint: 'もしものとき、衝動に流されないために。手の届かない場所に置いておくものなど。',
    placeholder: '例: 余分な薬は信頼できる人に預ける、危ないものは見えないところにしまう',
  },
];

const FIELD_TO_API: Record<keyof PlanFields, string> = {
  warningSigns: 'warning_signs_encrypted',
  internalCoping: 'internal_coping_encrypted',
  socialDistractions: 'social_distractions_encrypted',
  trustedPeople: 'trusted_people_encrypted',
  professionals: 'professionals_encrypted',
  environment: 'environment_encrypted',
};

const API_TO_FIELD: Record<string, keyof PlanFields> = {
  warningSignsEncrypted: 'warningSigns',
  internalCopingEncrypted: 'internalCoping',
  socialDistractionsEncrypted: 'socialDistractions',
  trustedPeopleEncrypted: 'trustedPeople',
  professionalsEncrypted: 'professionals',
  environmentEncrypted: 'environment',
};

export default function SafetyPlanPage() {
  const [fields, setFields] = React.useState<PlanFields>({
    warningSigns: '',
    internalCoping: '',
    socialDistractions: '',
    trustedPeople: '',
    professionals: '',
    environment: '',
  });
  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);
  const [savedMessage, setSavedMessage] = React.useState<string | null>(null);
  const [editing, setEditing] = React.useState(false);

  React.useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const res = await fetch('/api/safety-plan');
        if (!res.ok) return;
        const { plan } = await res.json();
        if (cancelled || !plan) {
          if (!cancelled) setEditing(true); // no plan yet → start in edit mode
          return;
        }

        const decrypted: PlanFields = {
          warningSigns: '',
          internalCoping: '',
          socialDistractions: '',
          trustedPeople: '',
          professionals: '',
          environment: '',
        };
        for (const [apiKey, fieldKey] of Object.entries(API_TO_FIELD)) {
          const enc = plan[apiKey];
          if (enc) {
            const plain = await decrypt(enc);
            if (plain) decrypted[fieldKey] = plain;
          }
        }
        if (!cancelled) {
          setFields(decrypted);
          // Show in read mode if plan exists with content
          const hasContent = Object.values(decrypted).some((v) => v.trim().length > 0);
          setEditing(!hasContent);
        }
      } catch {
        // silent
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, []);

  async function handleSave() {
    setSaving(true);
    setSavedMessage(null);
    try {
      const body: Record<string, string | null> = {};
      for (const [fieldKey, apiKey] of Object.entries(FIELD_TO_API)) {
        const value = fields[fieldKey as keyof PlanFields].trim();
        body[apiKey] = value ? await encrypt(value) : null;
      }

      const res = await fetch('/api/safety-plan', {
        method: 'PATCH',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error('save failed');
      setSavedMessage('保存しました');
      setEditing(false);
    } catch {
      setSavedMessage('保存できませんでした。もう一度試してみてください');
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="px-5 pt-safe pb-4 flex justify-center pt-12">
        <span className="inline-block h-5 w-5 animate-spin rounded-full border-2 border-terracotta border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="px-5 pt-safe pb-4 space-y-5">
      <header className="flex items-center gap-3 pt-4">
        <Link href="/crisis" aria-label="戻る" className="p-2 -ml-2 rounded-pill hover:bg-accent-soft/40">
          <ArrowLeft size={20} />
        </Link>
        <h1 className="font-mincho text-h2 flex-1">セーフティプラン</h1>
        {!editing ? (
          <button
            onClick={() => setEditing(true)}
            className="text-small text-terracotta hover:underline"
          >
            編集
          </button>
        ) : null}
      </header>

      <Card warm className="space-y-2">
        <div className="flex items-start gap-3">
          <div className="rounded-full bg-plum/10 p-2 mt-0.5">
            <ShieldCheck size={18} className="text-plum" />
          </div>
          <div className="flex-1">
            <CardTitle className="text-body">平時に書いておくと、しんどい時の自分が助かります</CardTitle>
            <p className="mt-2 text-small text-muted leading-relaxed">
              全部埋めなくて大丈夫です。書きやすいところから少しずつ。<br />
              書いた内容は端末で暗号化されます。
            </p>
          </div>
        </div>
      </Card>

      {STEPS.map((step) => (
        <Card key={step.key} className="space-y-2">
          <CardLabel>{step.title}</CardLabel>
          <p className="text-small text-muted leading-relaxed">{step.hint}</p>
          {editing ? (
            <Textarea
              value={fields[step.key]}
              onChange={(e) => setFields((prev) => ({ ...prev, [step.key]: e.target.value }))}
              placeholder={step.placeholder}
              rows={4}
            />
          ) : (
            <p className="text-body text-ink leading-relaxed whitespace-pre-wrap min-h-[1.5rem]">
              {fields[step.key] || <span className="text-muted">— 未記入</span>}
            </p>
          )}
        </Card>
      ))}

      {editing ? (
        <>
          {savedMessage ? (
            <p className={`text-center text-small ${savedMessage.includes('できません') ? 'text-error' : 'text-sage'}`}>
              {savedMessage}
            </p>
          ) : null}
          <Button onClick={handleSave} loading={saving} className="w-full" size="lg">
            保存する
          </Button>
        </>
      ) : (
        <p className="text-center text-kana text-muted">
          困ったときに、ここに戻ってきてください。
        </p>
      )}
    </div>
  );
}
