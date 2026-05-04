'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Shield, Check, EyeOff } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { formatRelativeJa } from '@/lib/utils';

type Post = {
  id: string;
  authorId: string;
  displayName: string;
  content: string;
  heartsCount: number;
  status: string;
  createdAt: string;
  approvedAt: string | null;
};

type Tab = 'pending' | 'approved' | 'hidden';

const TABS: { key: Tab; label: string }[] = [
  { key: 'pending', label: '審査待ち' },
  { key: 'approved', label: '承認済み' },
  { key: 'hidden', label: '非表示' },
];

export function AdminPanel() {
  const [tab, setTab] = useState<Tab>('pending');
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const fetchPosts = useCallback(async (status: Tab) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/posts?status=${status}`);
      if (res.ok) {
        const data = await res.json();
        setPosts(data.posts ?? []);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPosts(tab);
  }, [tab, fetchPosts]);

  async function handleAction(postId: string, status: 'approved' | 'hidden') {
    setActionLoading(postId);
    try {
      const res = await fetch('/api/admin/posts', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ postId, status }),
      });
      if (res.ok) {
        setPosts((prev) => prev.filter((p) => p.id !== postId));
      }
    } finally {
      setActionLoading(null);
    }
  }

  const pendingCount = tab === 'pending' ? posts.length : null;

  return (
    <div className="px-5 pt-safe pb-8 space-y-5">
      <header className="flex items-center gap-3 pt-4">
        <Link href="/mypage" className="text-muted">
          <ArrowLeft size={20} />
        </Link>
        <div className="flex items-center gap-2">
          <Shield size={20} className="text-terracotta" />
          <h1 className="font-mincho text-h2">
            モデレーション
            {pendingCount !== null && pendingCount > 0 && (
              <span className="ml-2 text-small font-normal text-muted">
                ({pendingCount} 件)
              </span>
            )}
          </h1>
        </div>
      </header>

      {/* Tab pills */}
      <div className="flex gap-2">
        {TABS.map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`rounded-pill px-4 py-2 text-small transition-colors ${
              tab === key
                ? 'bg-terracotta text-white'
                : 'bg-accent-soft/40 text-muted hover:bg-accent-soft'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Post list */}
      {loading ? (
        <p className="text-center text-muted py-8">読み込み中...</p>
      ) : posts.length === 0 ? (
        <p className="text-center text-muted py-8">
          {tab === 'pending'
            ? '審査待ちの投稿はありません'
            : tab === 'approved'
              ? '承認済みの投稿はありません'
              : '非表示の投稿はありません'}
        </p>
      ) : (
        <div className="space-y-3">
          {posts.map((post) => (
            <Card key={post.id} className="space-y-3">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="text-body font-medium">{post.displayName}</p>
                  <p className="text-kana text-muted">
                    {formatRelativeJa(post.createdAt)}
                  </p>
                </div>
                <StatusBadge status={post.status} />
              </div>

              <p className="text-body whitespace-pre-wrap">{post.content}</p>

              {post.heartsCount > 0 && (
                <p className="text-kana text-muted">
                  ♥ {post.heartsCount}
                </p>
              )}

              <div className="flex gap-2 pt-1">
                {(post.status === 'pending' || post.status === 'hidden') && (
                  <Button
                    size="sm"
                    variant="primary"
                    loading={actionLoading === post.id}
                    onClick={() => handleAction(post.id, 'approved')}
                  >
                    <Check size={16} />
                    承認
                  </Button>
                )}
                {(post.status === 'pending' || post.status === 'approved') && (
                  <Button
                    size="sm"
                    variant="ghost"
                    loading={actionLoading === post.id}
                    onClick={() => handleAction(post.id, 'hidden')}
                  >
                    <EyeOff size={16} />
                    非表示にする
                  </Button>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    pending: 'bg-warn/20 text-warn',
    approved: 'bg-success/20 text-success',
    hidden: 'bg-accent-soft text-muted',
  };

  const labels: Record<string, string> = {
    pending: '審査待ち',
    approved: '承認済み',
    hidden: '非表示',
  };

  return (
    <span
      className={`rounded-pill px-2 py-0.5 text-kana ${styles[status] ?? 'bg-accent-soft text-muted'}`}
    >
      {labels[status] ?? status}
    </span>
  );
}
