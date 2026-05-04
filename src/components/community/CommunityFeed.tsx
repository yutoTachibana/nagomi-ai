'use client';

import * as React from 'react';
import { Heart, Send } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Textarea } from '@/components/ui/Textarea';
import { Input } from '@/components/ui/Input';
import { formatRelativeJa } from '@/lib/utils';

interface Post {
  id: string;
  display_name: string;
  content: string;
  hearts_count: number;
  status: string;
  created_at: string;
  approved_at?: string | null;
}

export function CommunityFeed() {
  const isEnabled = process.env.NEXT_PUBLIC_FEATURE_COMMUNITY === 'true';

  const [posts, setPosts] = React.useState<Post[]>([]);
  const [pending, setPending] = React.useState<Post[]>([]);
  const [heartedIds, setHeartedIds] = React.useState<Set<string>>(new Set());
  const [loading, setLoading] = React.useState(true);

  // Compose state
  const [composing, setComposing] = React.useState(false);
  const [displayName, setDisplayName] = React.useState('');
  const [content, setContent] = React.useState('');
  const [submitting, setSubmitting] = React.useState(false);
  const [submitted, setSubmitted] = React.useState(false);

  const fetchPosts = React.useCallback(async () => {
    try {
      const res = await fetch('/api/community');
      if (!res.ok) return;
      const data = await res.json();
      setPosts(data.posts ?? []);
      setPending(data.pending ?? []);
      setHeartedIds(new Set(data.heartedIds ?? []));
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    if (isEnabled) {
      fetchPosts();
    }
  }, [isEnabled, fetchPosts]);

  if (!isEnabled) {
    return (
      <Card className="p-5 text-center">
        <p className="text-body text-muted leading-relaxed">
          ハートだけのゆるやかなコミュニティ機能は、安全に運営できる体制が整うまでクローズドベータで検証中です。
        </p>
      </Card>
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!content.trim() || !displayName.trim()) return;

    setSubmitting(true);
    try {
      const res = await fetch('/api/community', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: content.trim(), display_name: displayName.trim() }),
      });
      if (res.ok) {
        setSubmitted(true);
        setContent('');
        setComposing(false);
        await fetchPosts();
      }
    } finally {
      setSubmitting(false);
    }
  }

  async function handleToggleHeart(postId: string) {
    const res = await fetch('/api/community/heart', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ post_id: postId }),
    });
    if (!res.ok) return;
    const data = await res.json();

    setHeartedIds((prev) => {
      const next = new Set(prev);
      if (data.hearted) {
        next.add(postId);
      } else {
        next.delete(postId);
      }
      return next;
    });

    setPosts((prev) =>
      prev.map((p) =>
        p.id === postId
          ? { ...p, hearts_count: p.hearts_count + (data.hearted ? 1 : -1) }
          : p,
      ),
    );
  }

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <span className="inline-block h-5 w-5 animate-spin rounded-full border-2 border-terracotta border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Submitted confirmation */}
      {submitted && (
        <Card className="p-4 bg-accent-soft/40">
          <p className="text-small text-ink leading-relaxed">
            投稿を受け付けました。24時間以内に公開されます。
          </p>
        </Card>
      )}

      {/* Compose area */}
      {composing ? (
        <Card className="p-5 space-y-4">
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="表示名"
              placeholder="ニックネーム"
              maxLength={30}
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              required
            />
            <div>
              <Textarea
                label="ひとこと"
                placeholder="いま思っていること、感じていることを..."
                maxLength={500}
                value={content}
                onChange={(e) => setContent(e.target.value)}
                className="min-h-[100px]"
                required
              />
              <p className="text-kana text-muted mt-1 text-right">
                {content.length} / 500
              </p>
            </div>
            <div className="flex gap-3">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setComposing(false)}
              >
                やめておく
              </Button>
              <Button
                type="submit"
                size="sm"
                loading={submitting}
                disabled={!content.trim() || !displayName.trim()}
              >
                <Send size={16} />
                投稿する
              </Button>
            </div>
          </form>
        </Card>
      ) : (
        <Button variant="ghost" onClick={() => setComposing(true)} className="w-full">
          想いを残す
        </Button>
      )}

      {/* Pending posts */}
      {pending.length > 0 && (
        <div className="space-y-3">
          {pending.map((post) => (
            <Card key={post.id} className="p-4 bg-accent-soft/30">
              <div className="flex items-center justify-between mb-2">
                <span className="text-small font-medium text-ink/70">
                  {post.display_name}
                </span>
                <span className="text-kana text-muted bg-accent-soft rounded-pill px-2 py-0.5">
                  審査中
                </span>
              </div>
              <p className="text-body leading-relaxed text-ink/60">
                {post.content}
              </p>
              <p className="text-kana text-muted mt-2">
                {formatRelativeJa(post.created_at)}
              </p>
            </Card>
          ))}
        </div>
      )}

      {/* Approved posts */}
      {posts.length === 0 && pending.length === 0 ? (
        <Card className="p-5 text-center">
          <p className="text-body text-muted leading-relaxed">
            まだ投稿はありません。最初のひとことを残してみませんか?
          </p>
        </Card>
      ) : (
        <div className="space-y-3">
          {posts.map((post) => {
            const hearted = heartedIds.has(post.id);
            return (
              <Card key={post.id} className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-small font-medium text-ink/80">
                    {post.display_name}
                  </span>
                  <span className="text-kana text-muted">
                    {formatRelativeJa(post.created_at)}
                  </span>
                </div>
                <p className="text-body leading-relaxed">{post.content}</p>
                <div className="mt-3 flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => handleToggleHeart(post.id)}
                    className="inline-flex items-center gap-1 rounded-pill px-2 py-1 text-small transition-colors hover:bg-accent-soft/40"
                    aria-label={hearted ? 'ハートを取り消す' : 'ハートを送る'}
                  >
                    <Heart
                      size={18}
                      className={
                        hearted
                          ? 'fill-sage text-sage'
                          : 'text-muted'
                      }
                    />
                    {post.hearts_count > 0 && (
                      <span className={hearted ? 'text-sage' : 'text-muted'}>
                        {post.hearts_count}
                      </span>
                    )}
                  </button>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
