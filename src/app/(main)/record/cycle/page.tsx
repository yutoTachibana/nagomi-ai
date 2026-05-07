'use client';

import * as React from 'react';
import Link from 'next/link';
import { ArrowLeft, Plus, Flower2, X } from 'lucide-react';
import { Card, CardLabel, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Textarea } from '@/components/ui/Textarea';
import { encrypt, decrypt } from '@/lib/crypto';
import { estimatePhase, phaseLabel, formatShortDate, type CycleEntry } from '@/lib/cycle';
import { cn } from '@/lib/utils';

interface RawEntry {
  id: string;
  startDate: string;
  endDate: string | null;
  noteEncrypted: string | null;
  createdAt: string;
}

function todayDateString(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export default function CyclePage() {
  const [trackEnabled, setTrackEnabled] = React.useState<boolean | null>(null);
  const [entries, setEntries] = React.useState<RawEntry[]>([]);
  const [notePreviews, setNotePreviews] = React.useState<Record<string, string>>({});
  const [loading, setLoading] = React.useState(true);

  const [showAdd, setShowAdd] = React.useState(false);
  const [startDate, setStartDate] = React.useState(todayDateString());
  const [endDate, setEndDate] = React.useState('');
  const [note, setNote] = React.useState('');
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  // ---- 初期化 ----
  React.useEffect(() => {
    let cancelled = false;
    async function init() {
      try {
        const profileRes = await fetch('/api/profile');
        if (profileRes.ok) {
          const data = await profileRes.json();
          const enabled = Boolean(data.profile?.trackCycle);
          if (!cancelled) setTrackEnabled(enabled);
          if (enabled) await loadEntries(cancelled);
        }
      } catch {
        // silent
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    init();
    return () => { cancelled = true; };
  }, []);

  async function loadEntries(cancelled = false) {
    const res = await fetch('/api/cycle');
    if (!res.ok) return;
    const data = await res.json();
    const list: RawEntry[] = data.entries ?? [];
    if (cancelled) return;
    setEntries(list);

    const previews: Record<string, string> = {};
    for (const e of list) {
      if (e.noteEncrypted) {
        const plain = await decrypt(e.noteEncrypted);
        if (plain) previews[e.id] = plain;
      }
    }
    if (!cancelled) setNotePreviews(previews);
  }

  async function handleEnable() {
    setLoading(true);
    try {
      const res = await fetch('/api/profile', {
        method: 'PATCH',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ track_cycle: true }),
      });
      if (res.ok) {
        setTrackEnabled(true);
        await loadEntries();
      }
    } finally {
      setLoading(false);
    }
  }

  async function handleDisable() {
    if (!confirm('サイクル記録を OFF にしますか? これまでの記録は残ります.')) return;
    const res = await fetch('/api/profile', {
      method: 'PATCH',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ track_cycle: false }),
    });
    if (res.ok) setTrackEnabled(false);
  }

  async function handleAdd() {
    setSaving(true);
    setError(null);
    try {
      const noteEnc = note.trim() ? await encrypt(note.trim()) : null;
      const res = await fetch('/api/cycle', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          start_date: startDate,
          end_date: endDate || null,
          note_encrypted: noteEnc,
        }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.message ?? '保存できませんでした');
      }
      setEndDate('');
      setNote('');
      setShowAdd(false);
      await loadEntries();
    } catch (e) {
      setError(e instanceof Error ? e.message : '保存できませんでした');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('この記録を削除しますか?')) return;
    const res = await fetch('/api/cycle', {
      method: 'DELETE',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ id }),
    });
    if (res.ok) await loadEntries();
  }

  if (loading) {
    return (
      <div className="px-5 pt-safe pb-4 flex justify-center pt-12">
        <span className="inline-block h-5 w-5 animate-spin rounded-full border-2 border-terracotta border-t-transparent" />
      </div>
    );
  }

  // ---- Opt-in 画面 ----
  if (!trackEnabled) {
    return (
      <div className="px-5 pt-safe pb-4 space-y-5">
        <header className="flex items-center gap-3 pt-4">
          <Link href="/record" aria-label="戻る" className="p-2 -ml-2 rounded-pill hover:bg-accent-soft/40">
            <ArrowLeft size={20} />
          </Link>
          <h1 className="font-mincho text-h2">サイクルの記録</h1>
        </header>

        <Card warm className="space-y-3">
          <div className="flex items-start gap-3">
            <div className="rounded-full bg-plum/10 p-2 mt-0.5">
              <Flower2 size={18} className="text-plum" />
            </div>
            <div className="flex-1 space-y-2">
              <CardTitle className="text-body leading-relaxed">
                月経サイクルと気分のリズムは、つながっていることがあります
              </CardTitle>
              <p className="text-small text-muted leading-relaxed">
                生理開始日を記録すると、気分の波の解釈に手がかりが増えます (PMS や 黄体期の不調など).
              </p>
              <p className="text-small text-muted leading-relaxed">
                記録は端末で暗号化されます。いつでも OFF にできて、データは残ります。
              </p>
            </div>
          </div>
        </Card>

        <Button onClick={handleEnable} className="w-full" size="lg">
          サイクル記録を始める
        </Button>

        <p className="text-center text-kana text-muted">
          記録しない選択も尊重されます
        </p>
      </div>
    );
  }

  // ---- 通常画面 ----
  const cycleEntries: CycleEntry[] = entries.map((e) => ({
    id: e.id,
    startDate: e.startDate,
    endDate: e.endDate,
  }));
  const phaseInfo = estimatePhase(cycleEntries);

  return (
    <div className="px-5 pt-safe pb-4 space-y-5">
      <header className="flex items-center gap-3 pt-4">
        <Link href="/record" aria-label="戻る" className="p-2 -ml-2 rounded-pill hover:bg-accent-soft/40">
          <ArrowLeft size={20} />
        </Link>
        <h1 className="font-mincho text-h2 flex-1">サイクルの記録</h1>
        <button onClick={handleDisable} className="text-kana text-muted hover:text-ink">
          OFF にする
        </button>
      </header>

      {phaseInfo ? (
        <Card warm className="space-y-2">
          <CardLabel>いまの推定</CardLabel>
          <p className="font-mincho text-h3 text-ink mt-1">
            {phaseLabel(phaseInfo.phase)}
          </p>
          <div className="text-small text-muted leading-relaxed space-y-0.5">
            <p>周期 {phaseInfo.dayInCycle} 日目 (推定 {phaseInfo.cycleLength} 日周期)</p>
            <p>次の予定: {formatShortDate(phaseInfo.nextPeriodEstimate)} あたり</p>
          </div>
          <p className="text-kana text-muted leading-relaxed pt-1">
            あくまで目安です。体調や年齢によって実際は前後します。
          </p>
        </Card>
      ) : (
        <Card className="text-center py-6 bg-paper/40">
          <p className="text-small text-muted leading-relaxed">
            最初の生理開始日を記録すると、推定が表示されます。
          </p>
        </Card>
      )}

      {showAdd ? (
        <Card className="space-y-4">
          <CardTitle className="text-body">生理を記録</CardTitle>
          <div>
            <CardLabel>開始日</CardLabel>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="input-paper mt-2"
            />
          </div>
          <div>
            <CardLabel>終了日 (任意)</CardLabel>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="input-paper mt-2"
            />
            <p className="text-kana text-muted mt-1">あとから編集できます</p>
          </div>
          <div>
            <CardLabel>メモ (任意)</CardLabel>
            <Textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="重さや気になったことなど"
              rows={2}
              className="mt-2"
            />
          </div>

          {error ? <p role="alert" className="text-small text-error">{error}</p> : null}

          <div className="flex gap-3">
            <Button variant="ghost" size="sm" onClick={() => setShowAdd(false)}>
              やめる
            </Button>
            <Button size="sm" onClick={handleAdd} loading={saving} className="flex-1">
              保存
            </Button>
          </div>
        </Card>
      ) : (
        <button
          onClick={() => setShowAdd(true)}
          className="flex items-center gap-3 rounded-card border border-dashed border-terracotta/40 bg-terracotta/5 px-4 py-4 text-terracotta hover:bg-terracotta/10 transition-colors w-full"
        >
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-terracotta/15">
            <Plus size={18} />
          </div>
          <span className="font-medium text-body">生理を記録</span>
        </button>
      )}

      {entries.length === 0 ? (
        <Card className="text-center py-8 bg-paper/40">
          <p className="text-body text-muted leading-loose">
            まだ記録はありません。
          </p>
        </Card>
      ) : (
        <div className="space-y-2">
          <CardLabel className="px-1">これまでの記録</CardLabel>
          <ul className="space-y-2">
            {entries.map((e) => (
              <li key={e.id}>
                <Card className={cn('py-3 px-4 group')}>
                  <div className="flex items-baseline justify-between gap-2">
                    <p className="text-body text-ink">
                      {formatShortDate(e.startDate)}
                      {e.endDate ? ` 〜 ${formatShortDate(e.endDate)}` : ' 〜 (継続中)'}
                    </p>
                    <button
                      onClick={() => handleDelete(e.id)}
                      className="text-kana text-muted/50 opacity-0 group-hover:opacity-100 hover:text-error/70 transition-opacity"
                      aria-label="削除"
                    >
                      <X size={14} />
                    </button>
                  </div>
                  {notePreviews[e.id] ? (
                    <p className="text-small text-muted mt-1 leading-relaxed">{notePreviews[e.id]}</p>
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
