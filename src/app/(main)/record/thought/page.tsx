'use client';

import * as React from 'react';
import Link from 'next/link';
import { ArrowLeft, Plus, NotebookPen } from 'lucide-react';
import { Card, CardLabel } from '@/components/ui/Card';
import { decrypt } from '@/lib/crypto';
import { formatRelativeJa } from '@/lib/utils';

interface ThoughtRecord {
  id: string;
  situationEncrypted: string | null;
  automaticThoughtEncrypted: string | null;
  balancedThoughtEncrypted: string | null;
  createdAt: string;
}

export default function ThoughtListPage() {
  const [records, setRecords] = React.useState<ThoughtRecord[]>([]);
  const [previews, setPreviews] = React.useState<Record<string, { situation?: string; thought?: string }>>({});
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const res = await fetch('/api/thought-record');
        if (!res.ok) return;
        const { records: data } = await res.json() as { records: ThoughtRecord[] };
        if (cancelled) return;
        setRecords(data ?? []);

        // 復号プレビュー
        const decrypted: Record<string, { situation?: string; thought?: string }> = {};
        for (const r of data ?? []) {
          const situation = r.situationEncrypted ? await decrypt(r.situationEncrypted) : null;
          const thought = r.balancedThoughtEncrypted
            ? await decrypt(r.balancedThoughtEncrypted)
            : r.automaticThoughtEncrypted ? await decrypt(r.automaticThoughtEncrypted) : null;
          decrypted[r.id] = {
            situation: situation ? (situation.length > 50 ? situation.slice(0, 50) + '...' : situation) : undefined,
            thought: thought ? (thought.length > 60 ? thought.slice(0, 60) + '...' : thought) : undefined,
          };
        }
        if (!cancelled) setPreviews(decrypted);
      } catch {
        // silent
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, []);

  return (
    <div className="px-5 pt-safe pb-4 space-y-5">
      <header className="flex items-center gap-3 pt-4">
        <Link href="/record" aria-label="戻る" className="p-2 -ml-2 rounded-pill hover:bg-accent-soft/40">
          <ArrowLeft size={20} />
        </Link>
        <h1 className="font-mincho text-h2 flex-1">思考の整理</h1>
      </header>

      <p className="text-small text-muted leading-relaxed px-1">
        頭の中にある気持ちと考えを、ゆっくり言葉にしていく場所です。
      </p>

      <Link
        href="/record/thought/new"
        className="flex items-center gap-3 rounded-card border border-dashed border-terracotta/40 bg-terracotta/5 px-4 py-4 text-terracotta hover:bg-terracotta/10 transition-colors"
      >
        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-terracotta/15">
          <Plus size={18} />
        </div>
        <div className="flex-1">
          <p className="font-medium text-body">新しく書き出す</p>
          <p className="text-kana text-muted/80 mt-0.5">気になっていることを整理する</p>
        </div>
      </Link>

      {loading ? (
        <div className="flex justify-center py-8">
          <span className="inline-block h-5 w-5 animate-spin rounded-full border-2 border-terracotta border-t-transparent" />
        </div>
      ) : records.length === 0 ? (
        <Card className="text-center py-8 bg-paper/40">
          <NotebookPen size={28} className="mx-auto text-muted/60" strokeWidth={1.4} />
          <p className="mt-3 text-body text-ink/70 leading-loose">
            まだ整理した記録はありません。
            <br />
            書きたくなったときに、ゆっくりで大丈夫です。
          </p>
        </Card>
      ) : (
        <div className="space-y-3">
          <CardLabel className="px-1">これまでの記録</CardLabel>
          <ul className="space-y-2">
            {records.map((r) => {
              const p = previews[r.id] ?? {};
              return (
                <li key={r.id}>
                  <Link href={`/record/thought/${r.id}`} className="block">
                    <Card className="py-3 px-4 hover:bg-accent-soft/20 transition-colors">
                      <div className="flex items-baseline justify-between gap-2 mb-1">
                        {p.situation ? (
                          <p className="text-small text-muted truncate flex-1">{p.situation}</p>
                        ) : (
                          <span className="text-kana text-muted/70">記録</span>
                        )}
                        <span className="text-kana text-muted whitespace-nowrap shrink-0">
                          {formatRelativeJa(r.createdAt)}
                        </span>
                      </div>
                      {p.thought ? (
                        <p className="text-body text-ink leading-relaxed">{p.thought}</p>
                      ) : null}
                    </Card>
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}
