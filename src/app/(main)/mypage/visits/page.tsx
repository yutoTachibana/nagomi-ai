'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';

interface Visit {
  id: string;
  visitedAt: string;
  nextVisit: string | null;
  notesEncrypted: string | null;
  createdAt: string;
}

function formatDate(dateStr: string): string {
  const [y, m, d] = dateStr.split('-');
  return `${y}/${m}/${d}`;
}

export default function VisitsPage() {
  const [visits, setVisits] = useState<Visit[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  // Form state
  const [visitedAt, setVisitedAt] = useState('');
  const [nextVisit, setNextVisit] = useState('');
  const [notes, setNotes] = useState('');

  const fetchVisits = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/visits');
      if (res.ok) {
        const data = await res.json();
        setVisits(data.entries ?? []);
      }
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchVisits();
  }, [fetchVisits]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!visitedAt) return;
    setSaving(true);
    setError('');

    try {
      const res = await fetch('/api/visits', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          visited_at: visitedAt,
          next_visit: nextVisit || undefined,
          notes_encrypted: notes || undefined,
        }),
      });

      if (res.ok) {
        setVisitedAt('');
        setNextVisit('');
        setNotes('');
        setShowForm(false);
        fetchVisits();
      } else {
        const data = await res.json().catch(() => ({}));
        setError(data.message ?? 'もう一度試してみてください');
      }
    } catch {
      setError('もう一度試してみてください');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="px-5 pt-safe pb-8 space-y-5">
      {/* Header */}
      <header className="flex items-center gap-3">
        <Link href="/mypage" className="text-muted hover:text-ink transition-colors" aria-label="戻る">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
        </Link>
        <h1 className="font-mincho text-h2">通院の記録</h1>
      </header>

      {/* Add button or form */}
      {!showForm ? (
        <Button variant="ghost" onClick={() => setShowForm(true)} className="w-full">
          通院を記録する
        </Button>
      ) : (
        <Card className="p-5">
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              type="date"
              label="通院日"
              value={visitedAt}
              onChange={(e) => setVisitedAt(e.target.value)}
              required
            />
            <Input
              type="date"
              label="次回予定"
              value={nextVisit}
              onChange={(e) => setNextVisit(e.target.value)}
            />
            <Textarea
              label="メモ"
              hint="主治医に伝えたいことなど"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
            />
            {error && <p className="text-kana text-error">{error}</p>}
            <div className="flex gap-3">
              <Button type="submit" loading={saving} className="flex-1">
                保存
              </Button>
              <Button type="button" variant="ghost" onClick={() => setShowForm(false)}>
                やめる
              </Button>
            </div>
          </form>
        </Card>
      )}

      {/* List */}
      {loading ? (
        <p className="text-center text-muted text-small">読み込み中...</p>
      ) : visits.length === 0 ? (
        <p className="text-center text-muted text-small py-8">通院の記録はまだありません。</p>
      ) : (
        <div className="space-y-3">
          {visits.map((v) => (
            <Card key={v.id} className="p-4 space-y-1">
              <p className="text-body">
                <span className="text-muted text-small">通院日: </span>
                {formatDate(v.visitedAt)}
              </p>
              {v.nextVisit && (
                <p className="text-body">
                  <span className="text-muted text-small">次回: </span>
                  {formatDate(v.nextVisit)}
                </p>
              )}
              {v.notesEncrypted && (
                <p className="text-small text-ink/70 mt-2">{v.notesEncrypted}</p>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
