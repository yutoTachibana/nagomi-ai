'use client';

import * as React from 'react';
import Link from 'next/link';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';

export default function ForgotPasswordPage() {
  const [email, setEmail] = React.useState('');
  const [busy, setBusy] = React.useState(false);
  const [sent, setSent] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);

    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      if (res.status === 429) {
        setError('少し時間をおいて、もう一度お試しください。');
        setBusy(false);
        return;
      }

      setSent(true);
    } catch {
      setError('送信できませんでした。もう一度お試しください。');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-1 flex-col justify-center space-y-6">
      <div className="text-center">
        <h1 className="font-mincho text-display">こもれび</h1>
        <p className="mt-2 text-small text-muted">
          パスワードのリセット
        </p>
      </div>

      <Card warm>
        {sent ? (
          <div className="space-y-4 text-center">
            <p className="text-body">
              メールを確認してください。リセットリンクを送信しました。
            </p>
            <p className="text-small text-muted">
              メールが届かない場合は、迷惑メールフォルダもご確認ください。
            </p>
          </div>
        ) : (
          <form onSubmit={onSubmit} className="space-y-4">
            <p className="text-small text-muted">
              登録したメールアドレスを入力してください。パスワードリセット用のリンクをお送りします。
            </p>
            <Input
              label="メールアドレス"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
            />
            {error ? (
              <p role="alert" className="text-small text-error text-center">
                {error}
              </p>
            ) : null}
            <Button type="submit" loading={busy} className="w-full" size="lg">
              リセットメールを送信
            </Button>
          </form>
        )}
      </Card>

      <p className="text-center text-small text-muted">
        <Link href="/login" className="text-terracotta underline">
          ログインに戻る
        </Link>
      </p>
    </div>
  );
}
