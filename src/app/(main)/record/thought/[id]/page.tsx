'use client';

import * as React from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { Card, CardLabel } from '@/components/ui/Card';
import { decrypt } from '@/lib/crypto';
import { COGNITIVE_DISTORTIONS } from '@/lib/cbt/distortions';
import type { EmotionEntry, CognitiveDistortion } from '@/types/db';

interface RawRecord {
  id: string;
  situationEncrypted: string | null;
  emotionsBefore: EmotionEntry[] | null;
  automaticThoughtEncrypted: string | null;
  evidenceForEncrypted: string | null;
  evidenceAgainstEncrypted: string | null;
  balancedThoughtEncrypted: string | null;
  emotionsAfter: EmotionEntry[] | null;
  cognitiveDistortions: CognitiveDistortion[] | null;
  createdAt: string;
}

interface DecryptedRecord {
  situation: string | null;
  emotionsBefore: EmotionEntry[];
  automaticThought: string | null;
  evidenceFor: string | null;
  evidenceAgainst: string | null;
  balancedThought: string | null;
  emotionsAfter: EmotionEntry[];
  distortions: CognitiveDistortion[];
  createdAt: string;
}

export default function ThoughtDetailPage() {
  const params = useParams<{ id: string }>();
  const id = params?.id;
  const [record, setRecord] = React.useState<DecryptedRecord | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [notFound, setNotFound] = React.useState(false);

  React.useEffect(() => {
    if (!id) return;
    let cancelled = false;
    async function load() {
      try {
        const res = await fetch('/api/thought-record');
        if (!res.ok) {
          if (!cancelled) setNotFound(true);
          return;
        }
        const { records } = await res.json() as { records: RawRecord[] };
        const target = records.find((r) => r.id === id);
        if (!target) {
          if (!cancelled) setNotFound(true);
          return;
        }

        const decrypted: DecryptedRecord = {
          situation: target.situationEncrypted ? await decrypt(target.situationEncrypted) : null,
          emotionsBefore: target.emotionsBefore ?? [],
          automaticThought: target.automaticThoughtEncrypted ? await decrypt(target.automaticThoughtEncrypted) : null,
          evidenceFor: target.evidenceForEncrypted ? await decrypt(target.evidenceForEncrypted) : null,
          evidenceAgainst: target.evidenceAgainstEncrypted ? await decrypt(target.evidenceAgainstEncrypted) : null,
          balancedThought: target.balancedThoughtEncrypted ? await decrypt(target.balancedThoughtEncrypted) : null,
          emotionsAfter: target.emotionsAfter ?? [],
          distortions: target.cognitiveDistortions ?? [],
          createdAt: target.createdAt,
        };
        if (!cancelled) setRecord(decrypted);
      } catch {
        if (!cancelled) setNotFound(true);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, [id]);

  if (loading) {
    return (
      <div className="px-5 pt-safe pb-4 flex justify-center pt-12">
        <span className="inline-block h-5 w-5 animate-spin rounded-full border-2 border-terracotta border-t-transparent" />
      </div>
    );
  }

  if (notFound || !record) {
    return (
      <div className="px-5 pt-safe pb-4 space-y-5">
        <header className="flex items-center gap-3 pt-4">
          <Link href="/record/thought" aria-label="戻る" className="p-2 -ml-2 rounded-pill hover:bg-accent-soft/40">
            <ArrowLeft size={20} />
          </Link>
          <h1 className="font-mincho text-h2">記録</h1>
        </header>
        <Card className="text-center py-8">
          <p className="text-body text-muted">この記録は見つかりませんでした。</p>
        </Card>
      </div>
    );
  }

  const distortionLabels = record.distortions
    .map((d) => COGNITIVE_DISTORTIONS.find((c) => c.key === d)?.name)
    .filter((x): x is string => Boolean(x));

  const date = new Date(record.createdAt);
  const dateLabel = `${date.getFullYear()}/${date.getMonth() + 1}/${date.getDate()}`;

  return (
    <div className="px-5 pt-safe pb-4 space-y-5">
      <header className="flex items-center gap-3 pt-4">
        <Link href="/record/thought" aria-label="戻る" className="p-2 -ml-2 rounded-pill hover:bg-accent-soft/40">
          <ArrowLeft size={20} />
        </Link>
        <h1 className="font-mincho text-h2 flex-1">思考の整理</h1>
        <span className="text-kana text-muted">{dateLabel}</span>
      </header>

      {record.situation ? (
        <Card>
          <CardLabel>状況</CardLabel>
          <p className="mt-2 text-body text-ink leading-relaxed whitespace-pre-wrap">{record.situation}</p>
        </Card>
      ) : null}

      {record.emotionsBefore.length > 0 ? (
        <Card>
          <CardLabel>そのときの気持ち</CardLabel>
          <ul className="mt-3 space-y-2">
            {record.emotionsBefore.map((e, i) => (
              <li key={i} className="flex items-center justify-between gap-2">
                <span className="text-body text-ink">{e.name}</span>
                <span className="text-small text-muted">{e.intensity}</span>
              </li>
            ))}
          </ul>
        </Card>
      ) : null}

      {record.automaticThought ? (
        <Card>
          <CardLabel>頭に浮かんだ考え</CardLabel>
          <p className="mt-2 text-body text-ink leading-relaxed whitespace-pre-wrap">{record.automaticThought}</p>
        </Card>
      ) : null}

      {distortionLabels.length > 0 ? (
        <Card>
          <CardLabel>気づいた思考のクセ</CardLabel>
          <div className="mt-3 flex flex-wrap gap-2">
            {distortionLabels.map((label) => (
              <span key={label} className="pill">{label}</span>
            ))}
          </div>
        </Card>
      ) : null}

      {record.evidenceFor ? (
        <Card>
          <CardLabel>その考えを支持する事実</CardLabel>
          <p className="mt-2 text-body text-ink leading-relaxed whitespace-pre-wrap">{record.evidenceFor}</p>
        </Card>
      ) : null}

      {record.evidenceAgainst ? (
        <Card>
          <CardLabel>反対側の事実</CardLabel>
          <p className="mt-2 text-body text-ink leading-relaxed whitespace-pre-wrap">{record.evidenceAgainst}</p>
        </Card>
      ) : null}

      {record.balancedThought ? (
        <Card warm>
          <CardLabel>もう少しバランスのとれた考え方</CardLabel>
          <p className="mt-2 text-body text-ink leading-relaxed whitespace-pre-wrap">{record.balancedThought}</p>
        </Card>
      ) : null}

      {record.emotionsAfter.length > 0 ? (
        <Card>
          <CardLabel>整理したあとの気持ち</CardLabel>
          <ul className="mt-3 space-y-2">
            {record.emotionsAfter.map((e, i) => (
              <li key={i} className="flex items-center justify-between gap-2">
                <span className="text-body text-ink">{e.name}</span>
                <span className="text-small text-muted">{e.intensity}</span>
              </li>
            ))}
          </ul>
        </Card>
      ) : null}
    </div>
  );
}
