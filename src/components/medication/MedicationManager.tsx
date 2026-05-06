'use client';

import * as React from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { TagChips } from '@/components/ui/TagChips';
import { encrypt, decrypt } from '@/lib/crypto';
import { Check, Minus, Plus, Pill } from 'lucide-react';
import {
  searchMedications,
  CATEGORY_LABEL,
  type MedicationSuggestion,
} from '@/lib/medication-suggestions';

// ----------------------------------------------------------------
// Types
// ----------------------------------------------------------------

interface Medication {
  id: string;
  name_encrypted: string;
  dosage: string | null;
  schedule: { times: string[]; days: string[] } | null;
  active: boolean;
  created_at: string;
  /** Client-side only: decrypted name */
  _name?: string;
}

interface MedicationLog {
  id: string;
  medication_id: string;
  status: 'taken' | 'skipped' | 'missed';
  scheduled_for: string;
  taken_at: string | null;
  note_encrypted: string | null;
  created_at: string;
}

type View = 'list' | 'add';

// ----------------------------------------------------------------
// Constants
// ----------------------------------------------------------------

const TIME_OPTIONS = ['あさ', 'ひる', 'よる', 'ねる前'];

function todayDateString(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

// ----------------------------------------------------------------
// Component
// ----------------------------------------------------------------

export function MedicationManager() {
  const [view, setView] = React.useState<View>('list');
  const [medications, setMedications] = React.useState<Medication[]>([]);
  const [logs, setLogs] = React.useState<MedicationLog[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);

  // Add-form state
  const [newName, setNewName] = React.useState('');
  const [newDosage, setNewDosage] = React.useState('');
  const [newTimes, setNewTimes] = React.useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = React.useState(false);

  const suggestions: MedicationSuggestion[] = React.useMemo(
    () => searchMedications(newName, 6),
    [newName],
  );

  // ----- Data fetching -----

  const fetchData = React.useCallback(async () => {
    try {
      const [medRes, logRes] = await Promise.all([
        fetch('/api/medication'),
        fetch('/api/medication/log'),
      ]);
      const medJson = await medRes.json();
      const logJson = await logRes.json();

      const meds: Medication[] = medJson.medications ?? [];
      // Decrypt names client-side
      const decrypted = await Promise.all(
        meds.map(async (m) => ({
          ...m,
          _name: (await decrypt(m.name_encrypted)) ?? '(名前を復号できません)',
        })),
      );

      setMedications(decrypted);
      setLogs(logJson.logs ?? []);
    } catch {
      // Silently handle — user can retry by revisiting
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    fetchData();
  }, [fetchData]);

  // ----- Helpers -----

  /** Get today's log for a given medication, if any */
  function todayLog(medicationId: string): MedicationLog | undefined {
    const today = todayDateString();
    return logs.find(
      (l) => l.medication_id === medicationId && l.scheduled_for.startsWith(today),
    );
  }

  // ----- Actions -----

  async function handleAdd() {
    if (!newName.trim()) return;
    setSaving(true);
    try {
      const nameEnc = await encrypt(newName.trim());
      const res = await fetch('/api/medication', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name_encrypted: nameEnc,
          dosage: newDosage.trim() || null,
          schedule: newTimes.length > 0 ? { times: newTimes, days: [] } : null,
        }),
      });
      if (res.ok) {
        setNewName('');
        setNewDosage('');
        setNewTimes([]);
        setView('list');
        await fetchData();
      }
    } finally {
      setSaving(false);
    }
  }

  async function handleLog(medicationId: string, status: 'taken' | 'skipped') {
    const now = new Date().toISOString();
    const res = await fetch('/api/medication/log', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        medication_id: medicationId,
        status,
        scheduled_for: todayDateString(),
        taken_at: status === 'taken' ? now : null,
        note_encrypted: null,
      }),
    });
    if (res.ok) {
      await fetchData();
    }
  }

  // ----- Render -----

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <span className="inline-block h-5 w-5 animate-spin rounded-full border-2 border-terracotta border-t-transparent" />
      </div>
    );
  }

  // --- Add medication view ---
  if (view === 'add') {
    return (
      <Card className="space-y-5 p-5">
        <h2 className="font-mincho text-h3">お薬を追加</h2>

        <div className="space-y-2 relative">
          <Input
            label="お薬の名前"
            placeholder="例: レクサプロ"
            value={newName}
            onChange={(e) => {
              setNewName(e.target.value);
              setShowSuggestions(true);
            }}
            onFocus={() => setShowSuggestions(true)}
            autoComplete="off"
          />
          {showSuggestions && suggestions.length > 0 && newName.trim() ? (
            <ul className="rounded-card border border-accent-soft bg-card shadow-soft divide-y divide-accent-soft/60 overflow-hidden">
              {suggestions.map((s) => (
                <li key={s.name}>
                  <button
                    type="button"
                    onClick={() => {
                      setNewName(s.name);
                      setShowSuggestions(false);
                    }}
                    className="flex w-full items-center justify-between px-4 py-2.5 text-left hover:bg-accent-soft/40 transition-colors"
                  >
                    <span className="text-body text-ink">{s.name}</span>
                    <span className="text-kana text-muted">
                      {CATEGORY_LABEL[s.category]}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          ) : null}
        </div>

        <Input
          label="用量（任意）"
          placeholder="例: 10mg / 1錠"
          value={newDosage}
          onChange={(e) => setNewDosage(e.target.value)}
        />

        <div className="space-y-2">
          <span className="block text-small text-ink/80">いつ飲むか（任意）</span>
          <TagChips options={TIME_OPTIONS} selected={newTimes} onChange={setNewTimes} />
        </div>

        <div className="flex gap-3 pt-2">
          <Button variant="ghost" size="sm" onClick={() => setView('list')}>
            やめる
          </Button>
          <Button size="sm" loading={saving} onClick={handleAdd} disabled={!newName.trim()}>
            保存する
          </Button>
        </div>
      </Card>
    );
  }

  // --- List view ---
  return (
    <div className="space-y-4">
      {medications.length === 0 ? (
        <Card className="p-5">
          <div className="flex flex-col items-center gap-3 py-4 text-center">
            <Pill size={28} className="text-muted/60" />
            <p className="text-body text-muted leading-relaxed">
              お薬の記録を始めると、ここに表示されます。
              <br />
              飲み忘れを責めることは、ここにはありません。
            </p>
          </div>
        </Card>
      ) : (
        medications.map((med) => {
          const log = todayLog(med.id);
          return (
            <MedicationCard
              key={med.id}
              medication={med}
              log={log}
              onLog={handleLog}
            />
          );
        })
      )}

      <Button
        variant="ghost"
        size="sm"
        className="w-full"
        onClick={() => setView('add')}
      >
        <Plus size={16} />
        お薬を追加
      </Button>
    </div>
  );
}

// ----------------------------------------------------------------
// Sub-component: single medication card
// ----------------------------------------------------------------

function MedicationCard({
  medication,
  log,
  onLog,
}: {
  medication: Medication;
  log: MedicationLog | undefined;
  onLog: (id: string, status: 'taken' | 'skipped') => Promise<void>;
}) {
  const [busy, setBusy] = React.useState(false);

  async function handle(status: 'taken' | 'skipped') {
    setBusy(true);
    try {
      await onLog(medication.id, status);
    } finally {
      setBusy(false);
    }
  }

  const schedule = medication.schedule;
  const timeLabel = schedule?.times?.length ? schedule.times.join('・') : null;

  return (
    <Card className="p-4 space-y-3">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="font-medium text-ink truncate">{medication._name}</p>
          {(medication.dosage || timeLabel) && (
            <p className="text-small text-muted mt-0.5">
              {[medication.dosage, timeLabel].filter(Boolean).join(' / ')}
            </p>
          )}
        </div>

        {log ? (
          <StatusBadge status={log.status} />
        ) : null}
      </div>

      {!log && (
        <div className="flex gap-2">
          <Button
            variant="ghost"
            size="sm"
            disabled={busy}
            onClick={() => handle('taken')}
            className="flex-1"
          >
            <Check size={16} className="text-sage" />
            飲めた
          </Button>
          <Button
            variant="ghost"
            size="sm"
            disabled={busy}
            onClick={() => handle('skipped')}
            className="flex-1"
          >
            <Minus size={16} className="text-muted" />
            今日はスキップ
          </Button>
        </div>
      )}
    </Card>
  );
}

// ----------------------------------------------------------------
// Status badge
// ----------------------------------------------------------------

function StatusBadge({ status }: { status: string }) {
  if (status === 'taken') {
    return (
      <span className="inline-flex items-center gap-1 rounded-pill bg-sage/15 px-3 py-1 text-small text-sage">
        <Check size={14} />
        飲めた
      </span>
    );
  }
  // skipped or missed — no alarming colors
  return (
    <span className="inline-flex items-center gap-1 rounded-pill bg-accent-soft/60 px-3 py-1 text-small text-muted">
      <Minus size={14} />
      スキップ
    </span>
  );
}
