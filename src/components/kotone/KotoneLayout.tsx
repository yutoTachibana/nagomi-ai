'use client';

import * as React from 'react';
import { List, Plus, ArrowLeft, Trash2, BookOpen } from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { formatRelativeJa } from '@/lib/utils';
import { Chat } from './Chat';

interface Conversation {
  id: string;
  title: string | null;
  updatedAt: Date | string;
}

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
}

interface Props {
  conversations: Conversation[];
}

export function KotoneLayout({ conversations: initialConversations }: Props) {
  const [conversations, setConversations] = React.useState<Conversation[]>(initialConversations);
  const [selectedId, setSelectedId] = React.useState<string | null>(
    initialConversations.length > 0 ? initialConversations[0].id : null,
  );
  const [showList, setShowList] = React.useState(false);
  const [loadedMessages, setLoadedMessages] = React.useState<Message[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [deleteConfirm, setDeleteConfirm] = React.useState<string | null>(null);

  // 会話が選択された時にメッセージを読み込む (初回マウント含む)
  const loadMessages = React.useCallback(async (convId: string) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/kotone/messages?conversation_id=${convId}`);
      if (res.ok) {
        const data = await res.json();
        setLoadedMessages(data.messages ?? []);
      }
    } catch {
      // 読み込み失敗時は空のまま
      setLoadedMessages([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // 初回: 最新の会話のメッセージを読み込む
  React.useEffect(() => {
    if (selectedId) {
      loadMessages(selectedId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleSelectConversation(id: string) {
    setLoading(true);
    try {
      const res = await fetch(`/api/kotone/messages?conversation_id=${id}`);
      if (res.ok) {
        const data = await res.json();
        setLoadedMessages(data.messages ?? []);
      } else {
        setLoadedMessages([]);
      }
    } catch {
      setLoadedMessages([]);
    } finally {
      setLoading(false);
    }
    setSelectedId(id);
    setShowList(false);
  }

  function handleNewConversation() {
    setSelectedId(null);
    setLoadedMessages([]);
    setShowList(false);
  }

  function handleConversationCreated(id: string, title: string) {
    const newConv: Conversation = {
      id,
      title: title || '新しい会話',
      updatedAt: new Date().toISOString(),
    };
    setConversations((prev) => [newConv, ...prev]);
    setSelectedId(id);
  }

  async function handleDelete(convId: string) {
    try {
      const res = await fetch('/api/kotone/conversations', {
        method: 'DELETE',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ conversation_id: convId }),
      });
      if (res.ok) {
        setConversations((prev) => prev.filter((c) => c.id !== convId));
        if (selectedId === convId) {
          setSelectedId(null);
          setLoadedMessages([]);
        }
      }
    } catch {
      // 削除失敗は静かに無視
    } finally {
      setDeleteConfirm(null);
    }
  }

  // 会話一覧表示
  if (showList) {
    return (
      <div className="flex h-full flex-col bg-paper">
        {/* ヘッダー */}
        <header className="border-b border-accent-soft px-5 py-3 pt-safe">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowList(false)}
              className="flex h-9 w-9 items-center justify-center rounded-full hover:bg-accent-soft/40 transition-colors"
              aria-label="戻る"
            >
              <ArrowLeft size={20} className="text-ink" />
            </button>
            <p className="font-mincho text-body flex-1">会話の履歴</p>
            <Link
              href="/kotone/note"
              className="flex h-9 w-9 items-center justify-center rounded-full hover:bg-accent-soft/40 transition-colors"
              aria-label="ことねノート"
            >
              <BookOpen size={20} className="text-muted" />
            </Link>
          </div>
        </header>

        {/* 新しい会話ボタン */}
        <div className="px-5 pt-4">
          <button
            onClick={handleNewConversation}
            className={cn(
              'flex w-full items-center gap-3 rounded-card border border-dashed border-accent-soft',
              'px-4 py-3 text-left transition-colors hover:bg-accent-soft/30',
            )}
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-terracotta/10">
              <Plus size={16} className="text-terracotta" />
            </div>
            <span className="text-body text-ink">新しい会話</span>
          </button>
        </div>

        {/* 会話リスト */}
        <div className="flex-1 overflow-y-auto px-5 py-4">
          {conversations.length === 0 ? (
            <div className="py-12 text-center">
              <p className="text-body text-muted">まだ会話はありません</p>
              <p className="mt-2 text-small text-muted/70">
                ことねに話しかけてみませんか
              </p>
            </div>
          ) : (
            <ul className="space-y-2">
              {conversations.map((conv) => (
                <li key={conv.id} className="group relative">
                  <button
                    onClick={() => handleSelectConversation(conv.id)}
                    className={cn(
                      'w-full rounded-card border border-accent-soft px-4 py-3 text-left transition-colors',
                      'hover:bg-accent-soft/30',
                      selectedId === conv.id && 'bg-accent-soft/40 border-terracotta/30',
                    )}
                  >
                    <p className="text-body text-ink truncate pr-8">
                      {conv.title || '新しい会話'}
                    </p>
                    <p className="mt-1 text-kana text-muted">
                      {formatRelativeJa(conv.updatedAt)}
                    </p>
                  </button>

                  {/* 削除ボタン */}
                  {deleteConfirm === conv.id ? (
                    <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                      <button
                        onClick={() => handleDelete(conv.id)}
                        className="rounded-pill px-3 py-1 text-kana bg-error/10 text-error hover:bg-error/20 transition-colors"
                      >
                        削除
                      </button>
                      <button
                        onClick={() => setDeleteConfirm(null)}
                        className="rounded-pill px-3 py-1 text-kana text-muted hover:bg-accent-soft/40 transition-colors"
                      >
                        やめる
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setDeleteConfirm(conv.id)}
                      className={cn(
                        'absolute right-3 top-1/2 -translate-y-1/2',
                        'flex h-7 w-7 items-center justify-center rounded-full',
                        'text-muted/50 hover:text-error/70 hover:bg-error/5 transition-colors',
                        'opacity-0 group-hover:opacity-100 focus:opacity-100',
                      )}
                      aria-label="会話を削除"
                    >
                      <Trash2 size={14} />
                    </button>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    );
  }

  // チャット表示
  // key には loading 状態も含める. 履歴のロード完了時に Chat を再マウントして
  // initialMessages を反映させる (useState の初期値はマウント時しか効かないため).
  const chatKey = selectedId
    ? `${selectedId}-${loading ? 'loading' : 'loaded'}`
    : 'new';
  return (
    <Chat
      key={chatKey}
      conversationId={selectedId ?? undefined}
      initialMessages={selectedId ? loadedMessages : []}
      onConversationCreated={handleConversationCreated}
      onShowList={() => setShowList(true)}
      loading={loading}
    />
  );
}
