'use client';

import * as React from 'react';
import { Send, AlertCircle, List, BookOpen, LifeBuoy } from 'lucide-react';
import { cn } from '@/lib/utils';
import Link from 'next/link';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  crisis?: boolean;
  pending?: boolean;
}

interface Props {
  conversationId?: string;
  initialMessages?: Message[];
  onConversationCreated?: (id: string, title: string) => void;
  onShowList?: () => void;
  loading?: boolean;
}

export function Chat({ conversationId: initialConvId, initialMessages = [], onConversationCreated, onShowList, loading }: Props) {
  const [messages, setMessages] = React.useState<Message[]>(initialMessages);
  const [input, setInput] = React.useState('');
  const [streaming, setStreaming] = React.useState(false);
  const [conversationId, setConversationId] = React.useState<string | undefined>(initialConvId);
  const [showCrisisBanner, setShowCrisisBanner] = React.useState(false);

  const scrollRef = React.useRef<HTMLDivElement>(null);
  const textareaRef = React.useRef<HTMLTextAreaElement>(null);
  const hasScrolledOnceRef = React.useRef(false);

  // 自動スクロール: 初回マウント時はアニメーションなしで一気に最下部へ.
  // 以降のメッセージ追加時は smooth で滑らかに.
  React.useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    if (!hasScrolledOnceRef.current) {
      el.scrollTop = el.scrollHeight;
      hasScrolledOnceRef.current = true;
    } else {
      el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' });
    }
  }, [messages, loading]);

  // ローディング完了後 (履歴取得直後) にも最下部へ
  React.useEffect(() => {
    if (!loading && scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [loading]);

  // textarea 高さ自動調整
  React.useEffect(() => {
    const ta = textareaRef.current;
    if (!ta) return;
    ta.style.height = 'auto';
    ta.style.height = `${Math.min(ta.scrollHeight, 160)}px`;
  }, [input]);

  async function send() {
    const text = input.trim();
    if (!text || streaming) return;

    const userMsg: Message = {
      id: `u_${Date.now()}`,
      role: 'user',
      content: text,
    };
    const assistantId = `a_${Date.now()}`;
    setMessages((prev) => [...prev, userMsg, { id: assistantId, role: 'assistant', content: '', pending: true }]);
    setInput('');
    setStreaming(true);

    try {
      const res = await fetch('/api/kotone', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          conversation_id: conversationId,
          message: text,
        }),
      });

      if (!res.ok || !res.body) {
        throw new Error('応答を受け取れませんでした');
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buf = '';

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        buf += decoder.decode(value, { stream: true });

        // SSE: 各イベントは "\n\n" 区切り
        const events = buf.split('\n\n');
        buf = events.pop() ?? '';

        for (const evt of events) {
          if (!evt.startsWith('data: ')) continue;
          const data = evt.slice(6);
          if (data === '[DONE]') continue;
          try {
            const parsed = JSON.parse(data) as
              | { type: 'meta'; conversation_id: string }
              | { type: 'chunk'; text: string }
              | { type: 'crisis'; level: 'concern' | 'imminent' }
              | { type: 'error'; message: string };

            if (parsed.type === 'meta') {
              setConversationId(parsed.conversation_id);
              // 新規会話作成時に親コンポーネントへ通知
              if (!initialConvId && onConversationCreated) {
                onConversationCreated(parsed.conversation_id, text);
              }
            } else if (parsed.type === 'chunk') {
              setMessages((prev) =>
                prev.map((m) =>
                  m.id === assistantId
                    ? { ...m, content: m.content + parsed.text, pending: false }
                    : m,
                ),
              );
            } else if (parsed.type === 'crisis') {
              setShowCrisisBanner(true);
              setMessages((prev) =>
                prev.map((m) => (m.id === assistantId ? { ...m, crisis: true } : m)),
              );
            } else if (parsed.type === 'error') {
              throw new Error(parsed.message);
            }
          } catch (err) {
            console.error('parse SSE failed', err);
          }
        }
      }
    } catch (e) {
      setMessages((prev) =>
        prev.map((m) =>
          m.id === assistantId
            ? {
                ...m,
                content:
                  'うまくお返事できませんでした。少し時間をおいて、もう一度送ってもらえますか。',
                pending: false,
              }
            : m,
        ),
      );
      console.error(e);
    } finally {
      setStreaming(false);
    }
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    // Enter は改行. Cmd/Ctrl + Enter で送信
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
      e.preventDefault();
      send();
    }
  }

  return (
    <div className="flex h-[100dvh] flex-col">
      {/* ヘッダー */}
      <header className="border-b border-accent-soft px-5 py-3 pt-safe">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-full bg-terracotta/15 flex items-center justify-center">
            <span className="font-mincho text-terracotta">こ</span>
          </div>
          <div className="flex-1">
            <p className="font-mincho text-body">ことね</p>
            <p className="text-kana text-muted">あなたの話を聞きます</p>
          </div>
          <Link
            href="/kotone/note"
            className="flex h-9 w-9 items-center justify-center rounded-full hover:bg-accent-soft/40 transition-colors"
            aria-label="ことねノート"
          >
            <BookOpen size={20} className="text-muted" />
          </Link>
          {onShowList ? (
            <button
              onClick={onShowList}
              className="flex h-9 w-9 items-center justify-center rounded-full hover:bg-accent-soft/40 transition-colors"
              aria-label="会話一覧"
            >
              <List size={20} className="text-muted" />
            </button>
          ) : null}
          <Link
            href="/crisis"
            className="flex h-9 w-9 items-center justify-center rounded-full hover:bg-plum/10 transition-colors"
            aria-label="サポートが必要なときはこちら"
          >
            <LifeBuoy size={18} className="text-plum/70" />
          </Link>
        </div>
      </header>

      {/* AI 説明バナー (初回のみ) */}
      {messages.length === 0 ? (
        <div className="px-5 pt-4">
          <div className="rounded-card border border-accent-soft bg-card/60 p-4 text-small text-muted leading-relaxed">
            ことねは AI です。診断や治療はできず、医師の代わりにはなれません。<br />
            それでも、夜中でも話せる相手として、ここにいます。
          </div>
        </div>
      ) : null}

      {/* クライシスバナー */}
      {showCrisisBanner ? (
        <div className="mx-5 mt-3 flex items-start gap-2 rounded-card border border-plum/30 bg-plum/5 p-3 text-small text-ink">
          <AlertCircle size={18} className="mt-0.5 flex-shrink-0 text-plum" />
          <div>
            <p className="font-medium">今、しんどい時間ですね</p>
            <p className="mt-1 text-muted">
              一人で抱え込まないために、専門の相談窓口を見ておきませんか。
            </p>
            <Link href="/crisis" className="mt-2 inline-block text-plum underline">
              緊急サポートを見る →
            </Link>
          </div>
        </div>
      ) : null}

      {/* メッセージ */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-5 py-6">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <span className="inline-block h-5 w-5 animate-spin rounded-full border-2 border-terracotta border-t-transparent" />
          </div>
        ) : (
        <ul className="space-y-4">
          {messages.length === 0 ? (
            <li className="py-8 text-center">
              <p className="font-mincho text-h3 leading-loose text-ink/70">
                どんなことでも、<br />ゆっくりで大丈夫です
              </p>
              <p className="mt-2 text-small text-muted">
                書きたい言葉が見つからなくても、それでも来てくれて嬉しいです。
              </p>
            </li>
          ) : null}
          {messages.map((m) => (
            <li
              key={m.id}
              className={cn('flex', m.role === 'user' ? 'justify-end' : 'justify-start')}
            >
              <div
                className={cn(
                  'max-w-[85%] rounded-card px-4 py-3 leading-relaxed',
                  m.role === 'user'
                    ? 'bg-terracotta text-white'
                    : 'bg-card border border-accent-soft text-ink',
                  m.pending && 'animate-pulse',
                )}
              >
                {m.content || (m.pending ? '…' : '')}
              </div>
            </li>
          ))}
        </ul>
        )}
      </div>

      {/* 入力エリア */}
      <div className="border-t border-accent-soft bg-card/95 backdrop-blur-md px-3 py-3 pb-safe">
        <div className="flex items-end gap-2">
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={onKeyDown}
            placeholder="言葉にしてみる"
            rows={1}
            className="input-paper flex-1 resize-none py-2.5"
            style={{ minHeight: '44px' }}
          />
          <button
            onClick={send}
            disabled={!input.trim() || streaming}
            aria-label="送信"
            className={cn(
              'flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-full transition-colors',
              input.trim() && !streaming
                ? 'bg-terracotta text-white'
                : 'bg-accent-soft text-muted',
            )}
          >
            {streaming ? (
              <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
            ) : (
              <Send size={18} />
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
