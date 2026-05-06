'use client';

import * as React from 'react';
import Link from 'next/link';
import { ArrowLeft, RefreshCw } from 'lucide-react';
import { Card, CardLabel } from '@/components/ui/Card';
import { Textarea } from '@/components/ui/Textarea';
import { Button } from '@/components/ui/Button';
import { encrypt, decrypt } from '@/lib/crypto';
import { formatRelativeJa } from '@/lib/utils';
import { getRandomPrompts, JOURNAL_PROMPTS, type JournalPrompt } from '@/lib/journal-prompts';

interface JournalEntry {
  id: string;
  promptKey: string | null;
  contentEncrypted: string | null;
  createdAt: string;
}

export default function Page() {
  const [prompt, setPrompt] = React.useState<JournalPrompt | null>(null);
  const [content, setContent] = React.useState('');
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [saved, setSaved] = React.useState(false);
  const [entries, setEntries] = React.useState<JournalEntry[]>([]);
  const [previews, setPreviews] = React.useState<Record<string, string>>({});
  const [loadingEntries, setLoadingEntries] = React.useState(true);

  // Pick initial random prompt
  React.useEffect(() => {
    setPrompt(getRandomPrompts(1)[0]);
  }, []);

  // Load recent entries
  React.useEffect(() => {
    async function load() {
      try {
        const res = await fetch('/api/journal');
        if (!res.ok) return;
        const { entries: data } = await res.json();
        setEntries(data ?? []);

        // Decrypt previews (first ~40 chars)
        const decrypted: Record<string, string> = {};
        for (const entry of (data ?? []) as JournalEntry[]) {
          if (entry.contentEncrypted) {
            const plain = await decrypt(entry.contentEncrypted);
            if (plain) {
              decrypted[entry.id] = plain.length > 40 ? plain.slice(0, 40) + '...' : plain;
            }
          }
        }
        setPreviews(decrypted);
      } catch {
        // silently fail — entries list is not critical
      } finally {
        setLoadingEntries(false);
      }
    }
    load();
  }, [saved]);

  function refreshPrompt() {
    setPrompt(getRandomPrompts(1)[0]);
  }

  async function onSubmit() {
    if (!content.trim()) return;
    setSaving(true);
    setError(null);
    try {
      const encrypted = await encrypt(content.trim());
      const res = await fetch('/api/journal', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          content_encrypted: encrypted,
          prompt_key: prompt?.key ?? null,
        }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.message ?? '保存できませんでした。もう一度試してみてください。');
      }
      setContent('');
      setSaved((v) => !v); // toggle to re-fetch entries
      refreshPrompt();
    } catch (e) {
      setError(e instanceof Error ? e.message : '保存できませんでした。');
    } finally {
      setSaving(false);
    }
  }

  function promptTextByKey(key: string | null): string | null {
    if (!key) return null;
    return JOURNAL_PROMPTS.find((p) => p.key === key)?.text ?? null;
  }

  return (
    <div className="px-5 pt-safe pb-4 space-y-5">
      <header className="flex items-center gap-3 pt-4">
        <Link href="/record" aria-label="戻る" className="p-2 -ml-2 rounded-pill hover:bg-accent-soft/40">
          <ArrowLeft size={20} />
        </Link>
        <h1 className="font-mincho text-h2">ジャーナル</h1>
      </header>

      {/* Today's prompt */}
      {prompt ? (
        <Card warm>
          <div className="flex items-start justify-between gap-2">
            <div className="space-y-1 flex-1">
              <CardLabel>今日のプロンプト</CardLabel>
              <p className="font-mincho text-h3 leading-relaxed text-ink mt-2">
                {prompt.text}
              </p>
            </div>
            <button
              type="button"
              onClick={refreshPrompt}
              aria-label="別のプロンプトを表示"
              className="p-2 rounded-pill hover:bg-accent-soft/40 text-muted shrink-0"
            >
              <RefreshCw size={18} />
            </button>
          </div>
          <p className="text-kana text-muted mt-3">
            プロンプトを使わず自由に書いても大丈夫です
          </p>
        </Card>
      ) : null}

      {/* Writing area */}
      <Card>
        <Textarea
          label="今日のこと"
          hint="書いた内容は端末で暗号化されます。"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="思い浮かんだことを、そのまま..."
          rows={8}
        />
      </Card>

      {error ? (
        <p role="alert" className="text-center text-small text-error">
          {error}
        </p>
      ) : null}

      <Button
        onClick={onSubmit}
        loading={saving}
        disabled={!content.trim()}
        className="w-full"
        size="lg"
      >
        書きとめる
      </Button>

      <p className="text-center text-kana text-muted">
        書けない日は、それでいい。ここはいつでも開いています。
      </p>

      {/* Recent entries */}
      {!loadingEntries && entries.length > 0 ? (
        <div className="space-y-3 pt-2">
          <CardLabel>これまでのジャーナル</CardLabel>
          <div className="space-y-2">
            {entries.map((entry) => (
              <Card key={entry.id} className="py-3 px-4">
                <div className="flex items-baseline justify-between gap-2">
                  <p className="text-small text-ink truncate flex-1">
                    {previews[entry.id] ?? '(暗号化されています)'}
                  </p>
                  <span className="text-kana text-muted whitespace-nowrap shrink-0">
                    {formatRelativeJa(entry.createdAt)}
                  </span>
                </div>
                {entry.promptKey ? (
                  <p className="text-kana text-muted mt-1 truncate">
                    {promptTextByKey(entry.promptKey)}
                  </p>
                ) : null}
              </Card>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}
