'use client';

import * as React from 'react';
import Link from 'next/link';
import { ArrowLeft, Plus } from 'lucide-react';
import { Card, CardLabel } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Textarea } from '@/components/ui/Textarea';
import { encrypt, decrypt } from '@/lib/crypto';
import { formatRelativeJa, cn } from '@/lib/utils';
import {
  SIDE_EFFECT_TYPES,
  SIDE_EFFECT_CATEGORY_LABEL,
  type SideEffectType,
} from '@/lib/medication-side-effect-types';

interface Medication {
  id: string;
  nameEncrypted: string;
  _name?: string;
}

interface SideEffectEntry {
  id: string;
  medicationId: string | null;
  effectType: string;
  severity: number | null;
  noteEncrypted: string | null;
  recordedAt: string;
}

export default function SideEffectsPage() {
  const [medications, setMedications] = React.useState<Medication[]>([]);
  const [entries, setEntries] = React.useState<SideEffectEntry[]>([]);
  const [previews, setPreviews] = React.useState<Record<string, string>>({});
  const [loading, setLoading] = React.useState(true);

  const [view, setView] = React.useState<'list' | 'add'>('list');
  const [selectedMedId, setSelectedMedId] = React.useState<string>('');
  const [selectedEffect, setSelectedEffect] = React.useState<string>('');
  const [severity, setSeverity] = React.useState<number | null>(null);
  const [note, setNote] = React.useState('');
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const fetchAll = React.useCallback(async () => {
    setLoading(true);
    try {
      const [medRes, entryRes] = await Promise.all([
        fetch('/api/medication'),
        fetch('/api/medication/side-effects'),
      ]);
      const medJson = await medRes.json();
      const entryJson = await entryRes.json();

      const meds: Medication[] = medJson.medications ?? [];
      const decrypted = await Promise.all(
        meds.map(async (m) => ({
          ...m,
          _name: (await decrypt(m.nameEncrypted)) ?? '(名前を復号できません)',
        })),
      );
      setMedications(decrypted);
      setEntries(entryJson.entries ?? []);

      const noteMap: Record<string, string> = {};
      for (const e of entryJson.entries ?? []) {
        if (e.noteEncrypted) {
          const plain = await decrypt(e.noteEncrypted);
          if (plain) noteMap[e.id] = plain;
        }
      }
      setPreviews(noteMap);
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  function medicationName(id: string | null): string {
    if (!id) return 'お薬未指定';
    return medications.find((m) => m.id === id)?._name ?? 'お薬';
  }

  function effectLabel(key: string): string {
    return SIDE_EFFECT_TYPES.find((t) => t.key === key)?.label ?? key;
  }

  async function handleSave() {
    if (!selectedEffect) {
      setError('気になることを選んでください');
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const noteEnc = note.trim() ? await encrypt(note.trim()) : null;
      const res = await fetch('/api/medication/side-effects', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          medication_id: selectedMedId || null,
          effect_type: selectedEffect,
          severity: severity,
          note_encrypted: noteEnc,
        }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.message ?? '保存できませんでした');
      }
      // Reset form and reload
      setSelectedMedId('');
      setSelectedEffect('');
      setSeverity(null);
      setNote('');
      setView('list');
      await fetchAll();
    } catch (e) {
      setError(e instanceof Error ? e.message : '保存できませんでした');
    } finally {
      setSaving(false);
    }
  }

  // ----- Add view -----
  if (view === 'add') {
    const grouped = SIDE_EFFECT_TYPES.reduce<Record<string, SideEffectType[]>>((acc, t) => {
      (acc[t.category] ??= []).push(t);
      return acc;
    }, {});

    return (
      <div className="px-5 pt-safe pb-4 space-y-5">
        <header className="flex items-center gap-3 pt-4">
          <button onClick={() => setView('list')} aria-label="戻る" className="p-2 -ml-2 rounded-pill hover:bg-accent-soft/40">
            <ArrowLeft size={20} />
          </button>
          <h1 className="font-mincho text-h2">気になることを記録</h1>
        </header>

        <Card className="space-y-3">
          <CardLabel>どの薬で?</CardLabel>
          <select
            value={selectedMedId}
            onChange={(e) => setSelectedMedId(e.target.value)}
            className="input-paper"
          >
            <option value="">指定しない</option>
            {medications.map((m) => (
              <option key={m.id} value={m.id}>
                {m._name}
              </option>
            ))}
          </select>
        </Card>

        <Card className="space-y-3">
          <CardLabel>気になることは?</CardLabel>
          {Object.entries(grouped).map(([cat, types]) => (
            <div key={cat} className="space-y-2">
              <p className="text-kana text-muted">
                {SIDE_EFFECT_CATEGORY_LABEL[cat as SideEffectType['category']]}
              </p>
              <div className="flex flex-wrap gap-2">
                {types.map((t) => (
                  <button
                    key={t.key}
                    onClick={() => setSelectedEffect(t.key === selectedEffect ? '' : t.key)}
                    className={cn(
                      'rounded-pill px-3 py-1.5 text-small transition-colors',
                      selectedEffect === t.key
                        ? 'bg-terracotta text-white'
                        : 'bg-accent-soft/60 text-ink hover:bg-accent-soft',
                    )}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </Card>

        <Card className="space-y-3">
          <CardLabel>強さ (任意)</CardLabel>
          <div className="grid grid-cols-5 gap-2">
            {[1, 2, 3, 4, 5].map((s) => (
              <button
                key={s}
                onClick={() => setSeverity(s === severity ? null : s)}
                className={cn(
                  'rounded-card py-3 transition-colors font-mincho text-h3',
                  severity === s
                    ? 'bg-terracotta/15 border border-terracotta/30 text-terracotta'
                    : 'bg-accent-soft/30 border border-transparent text-ink/70 hover:bg-accent-soft/50',
                )}
              >
                {s}
              </button>
            ))}
          </div>
          <p className="text-kana text-muted">1: 軽め — 5: 強い</p>
        </Card>

        <Card>
          <CardLabel>メモ (任意)</CardLabel>
          <Textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="いつから気になっているか、状況など"
            rows={3}
            className="mt-2"
          />
        </Card>

        {error ? (
          <p role="alert" className="text-center text-small text-error">
            {error}
          </p>
        ) : null}

        <Button onClick={handleSave} loading={saving} disabled={!selectedEffect} className="w-full" size="lg">
          記録する
        </Button>

        <p className="text-center text-kana text-muted">
          副作用かどうかの判断は、主治医と一緒に
        </p>
      </div>
    );
  }

  // ----- List view -----
  return (
    <div className="px-5 pt-safe pb-4 space-y-5">
      <header className="flex items-center gap-3 pt-4">
        <Link href="/medication" aria-label="戻る" className="p-2 -ml-2 rounded-pill hover:bg-accent-soft/40">
          <ArrowLeft size={20} />
        </Link>
        <h1 className="font-mincho text-h2 flex-1">気になることの記録</h1>
      </header>

      <Card warm>
        <p className="text-body text-ink leading-relaxed">
          薬を飲んでいて気になる体の変化や違和感を、ここに記録しておけます。
        </p>
        <p className="mt-2 text-small text-muted leading-relaxed">
          副作用かどうかは主治医と一緒に判断するものです。記録は次の診察の手がかりに。
        </p>
      </Card>

      <button
        onClick={() => setView('add')}
        className="flex items-center gap-3 rounded-card border border-dashed border-terracotta/40 bg-terracotta/5 px-4 py-4 text-terracotta hover:bg-terracotta/10 transition-colors w-full"
      >
        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-terracotta/15">
          <Plus size={18} />
        </div>
        <span className="font-medium text-body">気になることを記録</span>
      </button>

      {loading ? (
        <div className="flex justify-center py-8">
          <span className="inline-block h-5 w-5 animate-spin rounded-full border-2 border-terracotta border-t-transparent" />
        </div>
      ) : entries.length === 0 ? (
        <Card className="text-center py-8 bg-paper/40">
          <p className="text-body text-muted leading-loose">
            まだ記録はありません。<br />
            気になる変化があれば、そっと書き留めて。
          </p>
        </Card>
      ) : (
        <div className="space-y-2">
          <CardLabel className="px-1">これまでの記録</CardLabel>
          <ul className="space-y-2">
            {entries.map((e) => (
              <li key={e.id}>
                <Card className="py-3 px-4">
                  <div className="flex items-baseline justify-between gap-2 mb-1">
                    <p className="text-body text-ink truncate flex-1">{effectLabel(e.effectType)}</p>
                    <span className="text-kana text-muted whitespace-nowrap shrink-0">
                      {formatRelativeJa(e.recordedAt)}
                    </span>
                  </div>
                  <p className="text-kana text-muted">
                    {medicationName(e.medicationId)}
                    {e.severity ? ` · 強さ ${e.severity}` : ''}
                  </p>
                  {previews[e.id] ? (
                    <p className="text-small text-ink/80 mt-1 leading-relaxed">{previews[e.id]}</p>
                  ) : null}
                </Card>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
