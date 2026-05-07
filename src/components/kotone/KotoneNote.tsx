'use client';

import * as React from 'react';
import { ArrowLeft, X, Plus } from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { Card, CardLabel } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Textarea } from '@/components/ui/Textarea';

// ====================================================================
// Types
// ====================================================================

interface ContextItem {
  id: string;
  category: string;
  content: string;
  source: 'ai' | 'user';
  createdAt: string;
}

type Category = 'background' | 'coping' | 'trigger' | 'preference' | 'custom';

// ====================================================================
// Constants
// ====================================================================

const CATEGORY_LABELS: Record<string, string> = {
  background: '生活の背景',
  coping: '助けになること',
  trigger: 'しんどくなりやすい場面',
  preference: '話し方の好み',
  custom: '自分からのメモ',
};

const CATEGORY_ADD_LABELS: { key: Category; label: string }[] = [
  { key: 'background', label: '生活' },
  { key: 'coping', label: '対処法' },
  { key: 'trigger', label: '苦手な場面' },
  { key: 'preference', label: '話し方' },
  { key: 'custom', label: 'メモ' },
];

const CATEGORY_ORDER: Category[] = ['background', 'coping', 'trigger', 'preference', 'custom'];

// ====================================================================
// Component
// ====================================================================

export function KotoneNote() {
  const [items, setItems] = React.useState<ContextItem[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [showAddForm, setShowAddForm] = React.useState(false);
  const [addCategory, setAddCategory] = React.useState<Category>('custom');
  const [addContent, setAddContent] = React.useState('');
  const [saving, setSaving] = React.useState(false);
  const [resetConfirm, setResetConfirm] = React.useState(false);
  const [resetting, setResetting] = React.useState(false);

  // Fetch items on mount
  React.useEffect(() => {
    fetchItems();
  }, []);

  async function fetchItems() {
    try {
      const res = await fetch('/api/kotone/context');
      if (res.ok) {
        const data = await res.json();
        setItems(data.items ?? []);
      }
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(id: string) {
    // Optimistic removal
    setItems((prev) => prev.filter((item) => item.id !== id));
    try {
      await fetch('/api/kotone/context', {
        method: 'DELETE',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ id }),
      });
    } catch {
      // Refetch on error
      fetchItems();
    }
  }

  async function handleAdd() {
    const content = addContent.trim();
    if (!content) return;
    setSaving(true);
    try {
      const res = await fetch('/api/kotone/context', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ category: addCategory, content }),
      });
      if (res.ok) {
        const data = await res.json();
        setItems((prev) => [data.item, ...prev]);
        setAddContent('');
        setShowAddForm(false);
      }
    } catch {
      // silent
    } finally {
      setSaving(false);
    }
  }

  async function handleResetAll() {
    setResetting(true);
    try {
      // Delete all items one by one
      await Promise.all(
        items.map((item) =>
          fetch('/api/kotone/context', {
            method: 'DELETE',
            headers: { 'content-type': 'application/json' },
            body: JSON.stringify({ id: item.id }),
          }),
        ),
      );
      setItems([]);
    } catch {
      fetchItems();
    } finally {
      setResetting(false);
      setResetConfirm(false);
    }
  }

  // Group items by category
  const grouped = React.useMemo(() => {
    const map: Record<string, ContextItem[]> = {};
    for (const item of items) {
      if (!map[item.category]) map[item.category] = [];
      map[item.category].push(item);
    }
    return map;
  }, [items]);

  const hasItems = items.length > 0;

  return (
    <div
      className="fixed top-0 left-1/2 -translate-x-1/2 w-full max-w-md flex flex-col bg-paper z-20"
      style={{ height: 'calc(100dvh - var(--nav-h))' }}
    >
      {/* Header */}
      <header className="border-b border-accent-soft px-5 py-3 pt-safe">
        <div className="flex items-center gap-3">
          <Link
            href="/kotone"
            className="flex h-9 w-9 items-center justify-center rounded-full hover:bg-accent-soft/40 transition-colors"
            aria-label="戻る"
          >
            <ArrowLeft size={20} className="text-ink" />
          </Link>
          <h1 className="font-mincho text-body flex-1">なごみノート</h1>
        </div>
      </header>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-5 pt-4 pb-safe space-y-5">
        {/* Description */}
        <p className="text-small text-muted leading-relaxed">
          なごみが会話の中から覚えたことです。
          間違っていたり、覚えていてほしくないことは消せます。
        </p>

        {loading ? (
          <div className="py-12 text-center">
            <p className="text-body text-muted">読み込み中...</p>
          </div>
        ) : !hasItems ? (
          /* Empty state */
          <div className="py-12 text-center">
            <p className="text-body text-muted">
              なごみはまだ何も覚えていません。
            </p>
            <p className="mt-2 text-small text-muted/70">
              会話を重ねるうちに、少しずつあなたのことを理解していきます。
            </p>
          </div>
        ) : (
          /* Category sections */
          CATEGORY_ORDER.map((cat) => {
            const catItems = grouped[cat];
            if (!catItems || catItems.length === 0) return null;
            return (
              <Card key={cat} className="p-4 space-y-3">
                <CardLabel>{CATEGORY_LABELS[cat]}</CardLabel>
                <ul className="space-y-2">
                  {catItems.map((item) => (
                    <li key={item.id} className="flex items-start gap-2 group">
                      <p className="flex-1 text-body text-ink leading-relaxed">
                        {item.content}
                      </p>
                      <span
                        className={cn(
                          'shrink-0 mt-0.5 rounded-pill px-2 py-0.5 text-kana',
                          item.source === 'ai'
                            ? 'bg-sage/15 text-sage'
                            : 'bg-terracotta/15 text-terracotta',
                        )}
                      >
                        {item.source === 'ai' ? 'AI推定' : '自分で追加'}
                      </span>
                      <button
                        onClick={() => handleDelete(item.id)}
                        className="shrink-0 mt-0.5 flex h-6 w-6 items-center justify-center rounded-full text-muted/40 hover:text-error/70 hover:bg-error/5 transition-colors"
                        aria-label="この項目を削除"
                      >
                        <X size={14} />
                      </button>
                    </li>
                  ))}
                </ul>
              </Card>
            );
          })
        )}

        {/* Add form */}
        {showAddForm ? (
          <Card className="p-4 space-y-4">
            <CardLabel>覚えていてほしいことを追加</CardLabel>

            {/* Category pills */}
            <div className="flex flex-wrap gap-2">
              {CATEGORY_ADD_LABELS.map(({ key, label }) => (
                <button
                  key={key}
                  onClick={() => setAddCategory(key)}
                  className={cn(
                    'rounded-pill px-3 py-1.5 text-small transition-colors',
                    addCategory === key
                      ? 'bg-terracotta text-white'
                      : 'bg-accent-soft/60 text-muted hover:bg-accent-soft',
                  )}
                >
                  {label}
                </button>
              ))}
            </div>

            <Textarea
              value={addContent}
              onChange={(e) => setAddContent(e.target.value)}
              placeholder="なごみに覚えていてほしいことを書いてください"
              rows={2}
              className="min-h-[72px]"
            />

            <div className="flex gap-3">
              <Button
                variant="primary"
                size="sm"
                onClick={handleAdd}
                loading={saving}
                disabled={!addContent.trim()}
              >
                保存
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setShowAddForm(false);
                  setAddContent('');
                }}
              >
                やめる
              </Button>
            </div>
          </Card>
        ) : (
          <button
            onClick={() => setShowAddForm(true)}
            className={cn(
              'flex w-full items-center gap-3 rounded-card border border-dashed border-accent-soft',
              'px-4 py-3 text-left transition-colors hover:bg-accent-soft/30',
            )}
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-terracotta/10">
              <Plus size={16} className="text-terracotta" />
            </div>
            <span className="text-body text-ink">覚えていてほしいことを追加</span>
          </button>
        )}

        {/* Reset all */}
        {hasItems ? (
          <div className="pt-4 pb-8">
            {resetConfirm ? (
              <Card className="p-4 space-y-3 border-error/20">
                <p className="text-body text-ink">
                  なごみが覚えていることを全てリセットします。よろしいですか？
                </p>
                <div className="flex gap-3">
                  <Button
                    variant="danger"
                    size="sm"
                    onClick={handleResetAll}
                    loading={resetting}
                  >
                    全てリセット
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setResetConfirm(false)}
                  >
                    やめる
                  </Button>
                </div>
              </Card>
            ) : (
              <button
                onClick={() => setResetConfirm(true)}
                className="text-small text-error/60 hover:text-error transition-colors"
              >
                全て忘れてもらう
              </button>
            )}
          </div>
        ) : null}
      </div>
    </div>
  );
}
