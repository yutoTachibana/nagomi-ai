'use client';

import * as React from 'react';
import { Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div className="flex flex-1 items-center justify-center"><p className="text-muted">読み込み中...</p></div>}>
      <ResetPasswordForm />
    </Suspense>
  );
}

function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  const [password, setPassword] = React.useState('');
  const [confirmPassword, setConfirmPassword] = React.useState('');
  const [busy, setBusy] = React.useState(false);
  const [done, setDone] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (password.length < 8) {
      setError('パスワードは8文字以上にしてください。');
      return;
    }

    if (password !== confirmPassword) {
      setError('パスワードが一致しません。');
      return;
    }

    setBusy(true);

    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => null);
        setError(data?.message ?? 'リンクが無効か期限切れです。もう一度お試しください。');
        setBusy(false);
        return;
      }

      setDone(true);
    } catch {
      setError('送信できませんでした。もう一度お試しください。');
    } finally {
      setBusy(false);
    }
  }

  if (!token) {
    return (
      <div className="flex flex-1 flex-col justify-center space-y-6">
        <div className="text-center">
          <h1 className="font-mincho text-display">こもれび</h1>
        </div>
        <Card warm>
          <div className="space-y-4 text-center">
            <p className="text-body">
              リンクが無効か期限切れです。もう一度お試しください。
            </p>
          </div>
        </Card>
        <p className="text-center text-small text-muted">
          <Link href="/forgot-password" className="text-terracotta underline">
            パスワードリセットをやり直す
          </Link>
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col justify-center space-y-6">
      <div className="text-center">
        <h1 className="font-mincho text-display">こもれび</h1>
        <p className="mt-2 text-small text-muted">新しいパスワードの設定</p>
      </div>

      <Card warm>
        {done ? (
          <div className="space-y-4 text-center">
            <p className="text-body">パスワードを再設定しました。ログインしてください。</p>
            <Link href="/login">
              <Button className="w-full" size="lg">ログインへ</Button>
            </Link>
          </div>
        ) : (
          <form onSubmit={onSubmit} className="space-y-4">
            <Input label="新しいパスワード" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={8} autoComplete="new-password" />
            <Input label="パスワードの確認" type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required minLength={8} autoComplete="new-password" />
            {error ? <p role="alert" className="text-small text-error text-center">{error}</p> : null}
            <Button type="submit" loading={busy} className="w-full" size="lg">パスワードを再設定</Button>
          </form>
        )}
      </Card>

      <p className="text-center text-small text-muted">
        <Link href="/login" className="text-terracotta underline">ログインに戻る</Link>
      </p>
    </div>
  );
}
